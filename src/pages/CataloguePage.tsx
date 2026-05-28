import { useEffect, useState } from 'react'
import { CatalogSearchResults } from '../components/CatalogSearchResults'
import { CatalogThemeSection } from '../components/CatalogThemeSection'
import { getQueryErrorMessage, searchAnimeFromCache } from '../lib/animeCache'
import type { AnimeCacheSummary } from '../types/animeCache'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300

export function CataloguePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnimeCacheSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!isSearching) {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await searchAnimeFromCache(trimmedQuery)
        if (!cancelled) {
          setResults(rows)
        }
      } catch (err) {
        if (!cancelled) {
          setResults([])
          setError(getQueryErrorMessage(err, 'Impossible de rechercher dans le catalogue.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [trimmedQuery, isSearching])

  return (
    <section className="catalogue-page">
      <div className="catalogue-page__search grid">
        <label className="friends-toolbar__search catalogue-page__search-bar">
          <input type="search" className="friends-toolbar__input" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} />
          <img src="/assets/loupe.svg" alt="" className="friends-toolbar__search-icon" width={21} height={21} />
        </label>
      </div>

      {isSearching ? (
        <CatalogSearchResults query={trimmedQuery} results={results} loading={loading} error={error} />
      ) : (
        <>
          <CatalogThemeSection variant="trending-year" />
          <CatalogThemeSection variant="trending-all-time" />
          <CatalogThemeSection variant="upcoming" />
        </>
      )}
    </section>
  )
}
