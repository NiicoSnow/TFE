import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import poolData from '../assets/quizAnimePool.json'
import { displayTitle, getAnimeSummariesFromCache } from '../lib/animeCache'
import { ANIME_LIST_LABELS, getLibraryStatusesForAnimes, getQueryErrorMessage, setAnimeListStatus } from '../lib/animeLibrary'
import { QUIZ_RESULT_COUNT } from '../lib/quizConfig'
import { getAffinityBreakdown, pickNextQuizResults } from '../lib/quizScoring'
import type { AnimeCacheSummary } from '../types/animeCache'
import type { AnimeListStatus } from '../types/animeLibrary'
import type { QuizAnimePool, QuizAnswers, QuizQuestion, ScoredAnime } from '../types/quiz'
import { useAuth } from '../hooks/useAuth'
import { publicAsset } from '../lib/publicPath'
import { AnimeListPickerModal } from './AnimeListPickerModal'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

const SWAP_EXIT_MS = 280
const SWAP_ENTER_MS = 320

const animePool = poolData as QuizAnimePool
const poolByAnilistId = new Map(animePool.animes.map((entry) => [entry.anilistId, entry]))

type QuizResultsProps = {
  /** Classement étendu (jusqu'à QUIZ_RESULT_RANK_DEPTH entrées). */
  results: ScoredAnime[]
  answers: QuizAnswers
  askedQuestions: QuizQuestion[]
  onRestart: () => void
}

type PickerTarget = {
  anilistId: number
  title: string
}

function buildInitialVisibleResults(
  rankedPool: ScoredAnime[],
  statusByAnilistId: Map<number, AnimeListStatus>,
): ScoredAnime[] {
  const excludeIds = new Set(statusByAnilistId.keys())
  return pickNextQuizResults(rankedPool, excludeIds, new Set(), QUIZ_RESULT_COUNT)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export function QuizResults({ results, answers, askedQuestions, onRestart }: QuizResultsProps) {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [visibleResults, setVisibleResults] = useState<ScoredAnime[]>(() =>
    buildInitialVisibleResults(results, new Map()),
  )
  const [rows, setRows] = useState<AnimeCacheSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusByAnilistId, setStatusByAnilistId] = useState<Map<number, AnimeListStatus>>(
    () => new Map(),
  )
  const [statusesLoaded, setStatusesLoaded] = useState(!user)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [listActionBusy, setListActionBusy] = useState(false)
  const [listFeedbackById, setListFeedbackById] = useState<Map<number, string>>(() => new Map())
  const [expandedAffinityId, setExpandedAffinityId] = useState<number | null>(null)
  const [exitingAnilistId, setExitingAnilistId] = useState<number | null>(null)
  const [enteringAnilistId, setEnteringAnilistId] = useState<number | null>(null)
  const swapBusyRef = useRef(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    initializedRef.current = false
    setVisibleResults(buildInitialVisibleResults(results, new Map()))
    setStatusByAnilistId(new Map())
    setStatusesLoaded(!user)
    setListFeedbackById(new Map())
    setExpandedAffinityId(null)
    setExitingAnilistId(null)
    setEnteringAnilistId(null)
    swapBusyRef.current = false
  }, [results, user])

  useEffect(() => {
    let cancelled = false
    const ids = visibleResults.map((r) => r.anilistId)

    async function load() {
      if (ids.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const missingIds = ids.filter((id) => !rows.some((row) => row.anilist_id === id))
      if (missingIds.length === 0) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await getAnimeSummariesFromCache(missingIds)
        if (!cancelled) {
          setRows((prev) => {
            const byId = new Map(prev.map((row) => [row.anilist_id, row]))
            for (const row of data) byId.set(row.anilist_id, row)
            return [...byId.values()]
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur chargement.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [visibleResults, rows])

  useEffect(() => {
    if (!user) {
      setStatusByAnilistId(new Map())
      setStatusesLoaded(true)
      return
    }

    let cancelled = false
    const ids = results.map((r) => r.anilistId)

    setStatusesLoaded(false)
    void (async () => {
      try {
        const statuses = await getLibraryStatusesForAnimes(user.id, ids)
        if (!cancelled) setStatusByAnilistId(statuses)
      } catch {
        if (!cancelled) setStatusByAnilistId(new Map())
      } finally {
        if (!cancelled) setStatusesLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, results])

  useEffect(() => {
    if (!statusesLoaded || initializedRef.current) return
    setVisibleResults(buildInitialVisibleResults(results, statusByAnilistId))
    initializedRef.current = true
  }, [statusesLoaded, results, statusByAnilistId])

  const posterById = new Map(rows.map((row) => [row.anilist_id, row.cover_url ?? POSTER_FALLBACK]))
  const titleById = new Map(rows.map((row) => [row.anilist_id, displayTitle(row)]))

  const openListPicker = (anilistId: number, title: string) => {
    if (authLoading) return
    if (!user) {
      navigate('/profil')
      return
    }
    setPickerTarget({ anilistId, title })
  }

  const toggleAffinityDetails = (anilistId: number) => {
    setExpandedAffinityId((current) => (current === anilistId ? null : anilistId))
  }

  const handleListSelect = async (status: AnimeListStatus) => {
    if (!user || !pickerTarget || swapBusyRef.current) return

    const addedId = pickerTarget.anilistId
    setListActionBusy(true)
    try {
      await setAnimeListStatus(user.id, addedId, status)

      const nextStatuses = new Map(statusByAnilistId).set(addedId, status)
      const slotIndex = visibleResults.findIndex((row) => row.anilistId === addedId)
      const remaining = visibleResults.filter((row) => row.anilistId !== addedId)
      const excludeIds = new Set(nextStatuses.keys())
      const currentlyShown = new Set(remaining.map((row) => row.anilistId))
      const [replacement] = pickNextQuizResults(results, excludeIds, currentlyShown, 1)

      setPickerTarget(null)
      setExpandedAffinityId((current) => (current === addedId ? null : current))
      swapBusyRef.current = true
      setExitingAnilistId(addedId)

      if (replacement) {
        try {
          const prefetch = await getAnimeSummariesFromCache([replacement.anilistId])
          setRows((prev) => {
            const byId = new Map(prev.map((row) => [row.anilist_id, row]))
            for (const row of prefetch) byId.set(row.anilist_id, row)
            return [...byId.values()]
          })
        } catch {
          // L'animation continue même si le préchargement échoue.
        }
      }

      if (!prefersReducedMotion()) {
        await waitForNextFrame()
      }

      await sleep(prefersReducedMotion() ? 0 : SWAP_EXIT_MS)

      setStatusByAnilistId(nextStatuses)

      if (!replacement) {
        setVisibleResults(remaining)
        setExitingAnilistId(null)
        swapBusyRef.current = false
        return
      }

      const nextVisible =
        slotIndex >= 0
          ? (() => {
              const next = [...remaining]
              next.splice(slotIndex, 0, replacement)
              return next
            })()
          : [...remaining, replacement].slice(0, QUIZ_RESULT_COUNT)

      setVisibleResults(nextVisible)
      setExitingAnilistId(null)
      setEnteringAnilistId(replacement.anilistId)

      if (!prefersReducedMotion()) {
        await waitForNextFrame()
      }

      await sleep(prefersReducedMotion() ? 0 : SWAP_ENTER_MS)
      setEnteringAnilistId(null)
      swapBusyRef.current = false
    } catch (err) {
      setExitingAnilistId(null)
      setEnteringAnilistId(null)
      swapBusyRef.current = false
      setListFeedbackById((prev) =>
        new Map(prev).set(
          addedId,
          getQueryErrorMessage(err, 'Ajout à la liste échoué'),
        ),
      )
    } finally {
      setListActionBusy(false)
    }
  }

  const pickerStatus = pickerTarget
    ? (statusByAnilistId.get(pickerTarget.anilistId) ?? null)
    : null

  return (
    <section className="quiz-results" aria-busy={loading}>
      <h2 className="quiz-results__title">Tes animes&nbsp;recommandés</h2>
      <p className="quiz-results__subtitle">
        Voici les titres qui correspondent le mieux à tes&nbsp;choix.
      </p>

      {error ? <p className="quiz-results__error">{error}</p> : null}

      {visibleResults.length === 0 && !loading && statusesLoaded ? (
        <p className="quiz-results__empty">
          Plus de nouvelles recommandations pour ce quiz. Essaie d&apos;en refaire un&nbsp;!
        </p>
      ) : null}

      <ol className="quiz-results__list">
        {visibleResults.map((result, index) => {
          const title = titleById.get(result.anilistId) ?? result.title
          const poster = posterById.get(result.anilistId) ?? POSTER_FALLBACK
          const libraryStatus = statusByAnilistId.get(result.anilistId) ?? null
          const listFeedback = listFeedbackById.get(result.anilistId)
          const addLabel = libraryStatus
            ? `Dans la liste : ${ANIME_LIST_LABELS[libraryStatus]}. Changer`
            : 'Ajouter à une liste'
          const poolEntry = poolByAnilistId.get(result.anilistId)
          const breakdown = poolEntry
            ? getAffinityBreakdown(poolEntry, answers, askedQuestions)
            : []
          const isAffinityExpanded = expandedAffinityId === result.anilistId
          const affinityDetailsId = `quiz-affinity-${result.anilistId}`
          const itemClassName = [
            'quiz-results__item',
            exitingAnilistId === result.anilistId ? 'quiz-results__item--exit' : '',
            enteringAnilistId === result.anilistId ? 'quiz-results__item--enter' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={result.anilistId} className={itemClassName}>
              <div className="quiz-results__item-row">
                <span className="quiz-results__rank">#{index + 1}</span>
                <Link
                  to={`/catalogue/anime/${result.anilistId}`}
                  className="quiz-results__poster-link"
                  aria-label={`Voir la fiche de ${title}`}
                >
                  <img className="quiz-results__poster" src={poster} alt="" />
                </Link>
                <div className="quiz-results__info">
                  <h3>{title}</h3>
                  {result.score > 0 && breakdown.length > 0 ? (
                    <button
                      type="button"
                      className="quiz-results__affinity"
                      aria-expanded={isAffinityExpanded}
                      aria-controls={affinityDetailsId}
                      onClick={() => toggleAffinityDetails(result.anilistId)}
                    >
                      <span className="quiz-results__affinity-text">
                        Affinité : {result.score} pts
                      </span>
                      <span className="quiz-results__affinity-more">
                        {isAffinityExpanded ? 'Masquer' : 'Voir plus'}
                      </span>
                    </button>
                  ) : result.score > 0 ? (
                    <p className="quiz-results__score">Affinité : {result.score} pts</p>
                  ) : null}
                  {listFeedback ? (
                    <p className="quiz-results__list-feedback" role="status">{listFeedback}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="quiz-results__add"
                  aria-label={addLabel}
                  onClick={() => openListPicker(result.anilistId, title)}
                >
                  <img
                    src={libraryStatus ? publicAsset('assets/inlist.svg') : publicAsset('assets/adding.svg')}
                    alt=""
                    width={40}
                    height={40}
                  />
                </button>
              </div>

              {isAffinityExpanded && breakdown.length > 0 ? (
                <div
                  id={affinityDetailsId}
                  className="quiz-results__breakdown"
                  role="region"
                  aria-label={`Détail de l'affinité pour ${title}`}
                >
                  <p className="quiz-results__breakdown-title">Détail par carte&nbsp;choisie</p>
                  <ul className="quiz-results__breakdown-list">
                    {breakdown.map((item) => (
                      <li
                        key={`${result.anilistId}-${item.questionTitle}-${item.choiceLabel}`}
                        className="quiz-results__breakdown-item"
                      >
                        <div className="quiz-results__breakdown-choice">
                          <p className="quiz-results__breakdown-label">{item.choiceLabel}</p>
                          <p className="quiz-results__breakdown-question">{item.questionTitle}</p>
                        </div>
                        <span
                          className={
                            item.points > 0
                              ? 'quiz-results__breakdown-points'
                              : 'quiz-results__breakdown-points quiz-results__breakdown-points--zero'
                          }
                        >
                          {item.points > 0 ? `+${item.points} pt${item.points > 1 ? 's' : ''}` : '0 pt'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="quiz-results__breakdown-total">
                    Total : <strong>{result.score} pts</strong>
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {loading ? <p className="quiz-results__loading">Chargement des affiches…</p> : null}

      <button type="button" className="quiz-results__restart" onClick={onRestart}>
        Refaire le quiz
      </button>

      {pickerTarget ? (
        <AnimeListPickerModal
          title={'Ajouter à une\u00A0liste'}
          animeTitle={pickerTarget.title}
          currentStatus={pickerStatus}
          onSelect={(status) => void handleListSelect(status)}
          onClose={() => !listActionBusy && setPickerTarget(null)}
          busy={listActionBusy}
        />
      ) : null}
    </section>
  )
}
