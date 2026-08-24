import { useEffect, useRef, useState } from 'react'
import { CatalogSearchResults } from '../components/CatalogSearchResults'
import { CatalogThemeSection } from '../components/CatalogThemeSection'
import {
  ANIME_CATALOG_GENRES,
  CATALOG_SEARCH_PAGE_SIZE,
  getQueryErrorMessage,
  listAnimeByGenreFromCache,
  searchAnimeFromCache,
} from '../lib/animeCache'
import { publicAsset } from '../lib/publicPath'
import type { AnimeCacheSummary } from '../types/animeCache'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300

export function CataloguePage() {
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [results, setResults] = useState<AnimeCacheSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const filterRootRef = useRef<HTMLDivElement>(null)

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH
  const isFiltering = selectedGenre != null
  const showResults = isSearching || isFiltering
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_SEARCH_PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [trimmedQuery, selectedGenre])

  useEffect(() => {
    if (!filtersOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const root = filterRootRef.current
      if (root && !root.contains(event.target as Node)) {
        setFiltersOpen(false)
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [filtersOpen])

  useEffect(() => {
    if (!showResults) {
      setResults([])
      setTotal(0)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const pageResult = selectedGenre
          ? await listAnimeByGenreFromCache(
              selectedGenre,
              page,
              CATALOG_SEARCH_PAGE_SIZE,
              isSearching ? trimmedQuery : undefined,
            )
          : await searchAnimeFromCache(trimmedQuery, page, CATALOG_SEARCH_PAGE_SIZE)

        if (!cancelled) {
          setResults(pageResult.rows)
          setTotal(pageResult.total)
        }
      } catch (err) {
        if (!cancelled) {
          setResults([])
          setTotal(0)
          setError(getQueryErrorMessage(err, 'Recherche échouée'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [trimmedQuery, isSearching, selectedGenre, showResults, page])

  useEffect(() => {
    if (page > 0 && page >= pageCount) {
      setPage(Math.max(0, pageCount - 1))
    }
  }, [page, pageCount])

  const selectGenre = (genre: string) => {
    setSelectedGenre((current) => (current === genre ? null : genre))
    setFiltersOpen(false)
  }

  const resultsLabel = selectedGenre
    ? isSearching
      ? `${trimmedQuery} · ${selectedGenre}`
      : selectedGenre
    : trimmedQuery

  return (
    <section className="catalogue-page">
      <div className="catalogue-page__search grid">
        <div className="catalogue-page__search-row" ref={filterRootRef}>
          <label className="friends-toolbar__search catalogue-page__search-bar">
            <input
              type="search"
              className="friends-toolbar__input"
              placeholder="Rechercher"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <img
              src={publicAsset('assets/loupe.svg')}
              alt=""
              className="friends-toolbar__search-icon"
              width={21}
              height={21}
            />
          </label>

          <button
            type="button"
            className={
              filtersOpen || selectedGenre
                ? 'catalogue-page__filter-btn catalogue-page__filter-btn--active'
                : 'catalogue-page__filter-btn'
            }
            aria-expanded={filtersOpen}
            aria-haspopup="listbox"
            aria-label="Filtres par genre"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span className="catalogue-page__filter-label">Filtres</span>
            <img
              src={publicAsset('assets/fleche.svg')}
              alt=""
              className={
                filtersOpen
                  ? 'catalogue-page__filter-chevron catalogue-page__filter-chevron--open'
                  : 'catalogue-page__filter-chevron'
              }
              width={12}
              height={12}
            />
            <img
              src={publicAsset('assets/settings.svg')}
              alt=""
              className="catalogue-page__filter-settings"
              width={22}
              height={22}
            />
          </button>

          {filtersOpen ? (
            <div className="catalogue-page__filter-panel" role="listbox" aria-label="Genres">
              <p className="catalogue-page__filter-heading">Genres</p>
              <ul className="catalogue-page__filter-list">
                {ANIME_CATALOG_GENRES.map((genre) => (
                  <li key={genre}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedGenre === genre}
                      className={
                        selectedGenre === genre
                          ? 'catalogue-page__filter-option catalogue-page__filter-option--selected'
                          : 'catalogue-page__filter-option'
                      }
                      onClick={() => selectGenre(genre)}
                    >
                      {genre}
                    </button>
                  </li>
                ))}
              </ul>
              {selectedGenre ? (
                <button
                  type="button"
                  className="catalogue-page__filter-clear"
                  onClick={() => {
                    setSelectedGenre(null)
                    setFiltersOpen(false)
                  }}
                >
                  Effacer le filtre
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showResults ? (
        <CatalogSearchResults
          query={resultsLabel}
          results={results}
          total={total}
          page={page}
          pageSize={CATALOG_SEARCH_PAGE_SIZE}
          loading={loading}
          error={error}
          onPageChange={setPage}
        />
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
