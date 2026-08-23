import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { displayTitle } from '../lib/animeCache'
import { getCatalogExpandSpan, layoutCatalogExpandRow } from '../lib/catalogExpandLayout'
import type { AnimeCacheSummary } from '../types/animeCache'
import { CatalogAnimeCard } from './CatalogAnimeCard'

const DESKTOP_CATALOG_MQ = '(min-width: 1024px)'

type CatalogSearchResultsProps = {
  query: string
  results: AnimeCacheSummary[]
  loading: boolean
  error: string | null
}

function formatResultCount(count: number, query: string) {
  if (count <= 1) {
    return `${count} résultat pour « ${query} »`
  }
  return `${count} résultats pour « ${query} »`
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

export function CatalogSearchResults({ query, results, loading, error }: CatalogSearchResultsProps) {
  const isDesktop = useMediaQuery(DESKTOP_CATALOG_MQ)
  const trackRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    setExpandedId(null)
  }, [query, results, isDesktop])

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

  return (
    <section className="catalogue-search grid">
      <p className="catalogue-search__count">{formatResultCount(results.length, query)}</p>
      {loading && <p className="catalogue-search__status">Recherche…</p>}
      {error && <p className="catalogue-search__status catalogue-search__status--error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="catalogue-search__status">Aucun anime trouvé dans le catalogue.</p>
      )}
      {!loading && !error && results.length > 0 && (
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
      )}
    </section>
  )
}
