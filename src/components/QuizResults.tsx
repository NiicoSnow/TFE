import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { displayTitle, getAnimeSummariesFromCache } from '../lib/animeCache'
import { ANIME_LIST_LABELS, getLibraryStatusesForAnimes, getQueryErrorMessage, setAnimeListStatus } from '../lib/animeLibrary'
import type { AnimeCacheSummary } from '../types/animeCache'
import type { AnimeListStatus } from '../types/animeLibrary'
import type { ScoredAnime } from '../types/quiz'
import { useAuth } from '../hooks/useAuth'
import { AnimeListPickerModal } from './AnimeListPickerModal'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

type QuizResultsProps = {
  results: ScoredAnime[]
  onRestart: () => void
}

type PickerTarget = {
  anilistId: number
  title: string
}

export function QuizResults({ results, onRestart }: QuizResultsProps) {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<AnimeCacheSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusByAnilistId, setStatusByAnilistId] = useState<Map<number, AnimeListStatus>>(
    () => new Map(),
  )
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [listActionBusy, setListActionBusy] = useState(false)
  const [listFeedbackById, setListFeedbackById] = useState<Map<number, string>>(() => new Map())

  useEffect(() => {
    let cancelled = false
    const ids = results.map((r) => r.anilistId)

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAnimeSummariesFromCache(ids)
        if (!cancelled) setRows(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Impossible de charger les animes')
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [results])

  useEffect(() => {
    if (!user) {
      setStatusByAnilistId(new Map())
      return
    }

    let cancelled = false
    const ids = results.map((r) => r.anilistId)

    void (async () => {
      try {
        const statuses = await getLibraryStatusesForAnimes(user.id, ids)
        if (!cancelled) setStatusByAnilistId(statuses)
      } catch {
        if (!cancelled) setStatusByAnilistId(new Map())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, results])

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

  const handleListSelect = async (status: AnimeListStatus) => {
    if (!user || !pickerTarget) return

    setListActionBusy(true)
    try {
      await setAnimeListStatus(user.id, pickerTarget.anilistId, status)
      setStatusByAnilistId((prev) => new Map(prev).set(pickerTarget.anilistId, status))
      setListFeedbackById((prev) =>
        new Map(prev).set(pickerTarget.anilistId, `Dans « ${ANIME_LIST_LABELS[status]} »`),
      )
      setPickerTarget(null)
    } catch (err) {
      setListFeedbackById((prev) =>
        new Map(prev).set(
          pickerTarget.anilistId,
          getQueryErrorMessage(err, 'Impossible d’ajouter à la liste'),
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
      <h2 className="quiz-results__title">Tes animes recommandés</h2>
      <p className="quiz-results__subtitle">
        Voici les titres qui correspondent le mieux à tes choix.
      </p>

      {error ? <p className="quiz-results__error">{error}</p> : null}

      <ol className="quiz-results__list">
        {results.map((result, index) => {
          const title = titleById.get(result.anilistId) ?? result.title
          const poster = posterById.get(result.anilistId) ?? POSTER_FALLBACK
          const libraryStatus = statusByAnilistId.get(result.anilistId) ?? null
          const listFeedback = listFeedbackById.get(result.anilistId)
          const addLabel = libraryStatus
            ? `Dans la liste : ${ANIME_LIST_LABELS[libraryStatus]}. Changer`
            : 'Ajouter à une liste'

          return (
            <li key={result.anilistId} className="quiz-results__item">
              <span className="quiz-results__rank">#{index + 1}</span>
              <img className="quiz-results__poster" src={poster} alt="" />
              <div className="quiz-results__info">
                <h3>{title}</h3>
                {result.score > 0 ? (
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
                  src={libraryStatus ? '/assets/inlist.svg' : '/assets/adding.svg'}
                  alt=""
                  width={40}
                  height={40}
                />
              </button>
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
          title="Ajouter à une liste"
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
