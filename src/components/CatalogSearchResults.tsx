import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { displayTitle } from '../lib/animeCache'
import { getCatalogExpandSpan, layoutCatalogExpandRow } from '../lib/catalogExpandLayout'
import { publicAsset } from '../lib/publicPath'
import type { AnimeCacheSummary } from '../types/animeCache'
import { CatalogAnimeCard } from './CatalogAnimeCard'

const DESKTOP_CATALOG_MQ = '(min-width: 1024px)'

type CatalogSearchResultsProps = {
  query: string
  results: AnimeCacheSummary[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
}

function formatResultCount(total: number, query: string) {
  if (total <= 1) {
    return `${total} résultat pour « ${query} »`
  }
  return `${total} résultats pour « ${query} »`
}

function measureColumnCount(track: HTMLElement) {
  const styles = getComputedStyle(track)
  const gapValue = styles.columnGap || styles.gap || '0'
  const gap = Number.parseFloat(gapValue) || 0
  const minVar = styles.getPropertyValue('--search-card-min').trim()
  const minWidth = Number.parseFloat(minVar) || 140
  const width = track.clientWidth
  if (width <= 0) return 1
  return Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
}

export function CatalogSearchResults({
  query,
  results,
  total,
  page,
  pageSize,
  loading,
  error,
  onPageChange,
}: CatalogSearchResultsProps) {
  const isDesktop = useMediaQuery(DESKTOP_CATALOG_MQ)
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const [columnCount, setColumnCount] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [pageEditing, setPageEditing] = useState(false)
  const [pageDraft, setPageDraft] = useState(String(page + 1))

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = page > 0
  const canGoNext = page < pageCount - 1 && total > 0

  useEffect(() => {
    setExpandedId(null)
  }, [query, results, isDesktop, page])

  useEffect(() => {
    if (!pageEditing) setPageDraft(String(page + 1))
  }, [page, pageEditing])

  useEffect(() => {
    if (!pageEditing) return
    const input = pageInputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [pageEditing])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || !isDesktop) {
      setColumnCount(1)
      return
    }

    const update = () => setColumnCount(measureColumnCount(track))
    update()

    const observer = new ResizeObserver(update)
    observer.observe(track)
    return () => observer.disconnect()
  }, [isDesktop, results.length])

  const expandedIndex =
    expandedId != null
      ? results.findIndex((row) => row.anilist_id === expandedId)
      : -1

  const expandSpan =
    isDesktop && expandedIndex >= 0
      ? getCatalogExpandSpan(displayTitle(results[expandedIndex]))
      : 3

  const displaySlots =
    isDesktop && expandedIndex >= 0
      ? layoutCatalogExpandRow(
          results,
          expandedIndex,
          Math.max(columnCount, expandSpan),
          expandSpan,
        )
      : results.map((item) => ({
          item,
          expanded: expandedId === item.anilist_id,
          wide: false,
        }))

  const goToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(0, nextPage), pageCount - 1)
    onPageChange(clamped)
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const commitPageDraft = () => {
    const parsed = Number.parseInt(pageDraft.trim(), 10)
    setPageEditing(false)
    if (!Number.isFinite(parsed)) {
      setPageDraft(String(page + 1))
      return
    }
    goToPage(parsed - 1)
  }

  const handlePageFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitPageDraft()
  }

  const handlePageInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setPageDraft(String(page + 1))
      setPageEditing(false)
    }
  }

  return (
    <section ref={sectionRef} className="catalogue-search grid">
      <p className="catalogue-search__count">{formatResultCount(total, query)}</p>
      {loading && <p className="catalogue-search__status">Recherche…</p>}
      {error && <p className="catalogue-search__status catalogue-search__status--error">{error}</p>}
      {!loading && !error && total === 0 && (
        <p className="catalogue-search__status">Aucun anime trouvé dans le catalogue.</p>
      )}
      {!loading && !error && results.length > 0 && (
        <>
          <div ref={trackRef} className="catalog-theme-section__content catalogue-search__grid">
            <div className="catalog-theme-section__track">
              {displaySlots.map(({ item, expanded, wide }) => (
                <CatalogAnimeCard
                  key={item.anilist_id}
                  anime={item}
                  expandEnabled
                  isExpanded={expanded}
                  expandWide={Boolean(wide)}
                  onExpandRequest={setExpandedId}
                  onCollapse={() => setExpandedId(null)}
                />
              ))}
            </div>
          </div>

          {pageCount > 1 ? (
            <div className="catalogue-search__pagination">
              <button
                type="button"
                className="catalog-theme-section__nav catalogue-search__page-btn"
                aria-label="Page précédente"
                disabled={!canGoPrev}
                onClick={() => goToPage(page - 1)}
              >
                <img
                  src={publicAsset('assets/fleche.svg')}
                  alt=""
                  className="catalog-theme-section__nav-icon catalog-theme-section__nav-icon--left"
                  width={17}
                  height={27}
                />
              </button>

              {pageEditing ? (
                <form className="catalogue-search__page-form" onSubmit={handlePageFormSubmit}>
                  <label className="catalogue-search__page-edit">
                    <span className="catalogue-search__page-edit-prefix">Page</span>
                    <input
                      ref={pageInputRef}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={pageCount}
                      className="catalogue-search__page-input"
                      value={pageDraft}
                      aria-label={`Aller à une page entre 1 et ${pageCount}`}
                      onChange={(event) => setPageDraft(event.target.value)}
                      onBlur={commitPageDraft}
                      onKeyDown={handlePageInputKeyDown}
                    />
                    <span className="catalogue-search__page-edit-suffix">/ {pageCount}</span>
                  </label>
                </form>
              ) : (
                <button
                  type="button"
                  className="catalogue-search__page-label"
                  aria-label={`Page ${page + 1} sur ${pageCount}. Cliquer pour choisir une page`}
                  onClick={() => {
                    setPageDraft(String(page + 1))
                    setPageEditing(true)
                  }}
                >
                  Page {page + 1} / {pageCount}
                </button>
              )}

              <button
                type="button"
                className="catalog-theme-section__nav catalogue-search__page-btn"
                aria-label="Page suivante"
                disabled={!canGoNext}
                onClick={() => goToPage(page + 1)}
              >
                <img
                  src={publicAsset('assets/fleche.svg')}
                  alt=""
                  className="catalog-theme-section__nav-icon"
                  width={17}
                  height={27}
                />
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
