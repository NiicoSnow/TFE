import { useEffect, useState } from 'react'
import { displayTitle, getAnimeSummariesFromCache } from '../lib/animeCache'
import type { AnimeCacheSummary } from '../types/animeCache'
import type { ScoredAnime } from '../types/quiz'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

type QuizResultsProps = {
  results: ScoredAnime[]
  onRestart: () => void
}

export function QuizResults({ results, onRestart }: QuizResultsProps) {
  const [rows, setRows] = useState<AnimeCacheSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const posterById = new Map(rows.map((row) => [row.anilist_id, row.cover_url ?? POSTER_FALLBACK]))
  const titleById = new Map(rows.map((row) => [row.anilist_id, displayTitle(row)]))

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

          return (
            <li key={result.anilistId} className="quiz-results__item">
              <span className="quiz-results__rank">#{index + 1}</span>
              <img className="quiz-results__poster" src={poster} alt="" />
              <div className="quiz-results__info">
                <h3>{title}</h3>
                {result.score > 0 ? (
                  <p className="quiz-results__score">Affinité : {result.score} pts</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {loading ? <p className="quiz-results__loading">Chargement des affiches…</p> : null}

      <button type="button" className="quiz-results__restart" onClick={onRestart}>
        Refaire le quiz
      </button>
    </section>
  )
}
