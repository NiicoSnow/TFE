import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { displayTitle, getCatalogSectionEmptyMessage, getCatalogSectionTitle, listForCatalogSection } from '../lib/animeCache'
import type { CatalogSectionProps } from '../types/catalogSection'
import type { AnimeCacheSummary } from '../types/animeCache'

export type CatalogTrendItem = {
  id: string
  title: string
  poster: string
}

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

const SECTION_MAX = 15
const PAGE_SIZE = 5

function mapToTrendItem(row: AnimeCacheSummary): CatalogTrendItem {
  return {
    id: String(row.anilist_id),
    title: displayTitle(row),
    poster: row.cover_url ?? POSTER_FALLBACK,
  }
}

export function CatalogThemeSection(props: CatalogSectionProps) {
  const [items, setItems] = useState<CatalogTrendItem[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sectionMax = props.variant === 'similar' ? 5 : SECTION_MAX
  const title = getCatalogSectionTitle(props)
  const emptyMessage = getCatalogSectionEmptyMessage(props)
  const maxVisible = Math.min(items.length, sectionMax)
  const tag = props.variant === 'tag' ? props.tag : null
  const similarKey =
    props.variant === 'similar'
      ? `${props.anilistId}:${props.genres.join('\0')}`
      : null

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rows = await listForCatalogSection(props, sectionMax)
        if (!cancelled) {
          setItems(rows.map(mapToTrendItem))
          setVisibleCount(PAGE_SIZE)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Impossible de charger le catalogue')
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [props.variant, tag, similarKey, sectionMax])

  const showMore = () => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, maxVisible))
  }

  const isFullyExpanded = visibleCount >= maxVisible

  const toggleSeeAll = () => {
    setVisibleCount(isFullyExpanded ? PAGE_SIZE : maxVisible)
  }

  const visibleItems = items.slice(0, visibleCount)
  const canShowMore = visibleCount < maxVisible
  const canToggleSeeAll = maxVisible > PAGE_SIZE

  const sectionClassName = props.embedded
    ? 'catalog-theme-section catalog-theme-section--embedded'
    : 'catalog-theme-section grid'

  return (
    <section className={sectionClassName} aria-busy={loading}>
      <header className="catalog-theme-section__header flex justify-between items-end">
        <h2 className="catalog-theme-section__title">{title}</h2>
        {canToggleSeeAll ? (
          <button
            type="button"
            className="catalog-theme-section__seemore seemore"
            onClick={toggleSeeAll}
            disabled={loading}
            aria-expanded={isFullyExpanded}
          >
            {isFullyExpanded ? 'Voir moins' : 'Voir tout'}
          </button>
        ) : null}
      </header>

      {loading ? (
        <p className="catalog-theme-section__status">Chargement…</p>
      ) : null}

      {error ? (
        <p className="catalog-theme-section__status catalog-theme-section__status--error">{error}</p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="catalog-theme-section__status">{emptyMessage}</p>
      ) : null}

      {!loading && !error && visibleItems.length > 0 ? (
        <div className="catalog-theme-section__content">
          <div className="catalog-theme-section__track">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                to={`/catalogue/anime/${item.id}`}
                className="catalog-theme-section__card"
              >
                <figure className="catalog-theme-section__poster">
                  <img src={item.poster} alt="" loading="lazy" />
                </figure>
                <div className="catalog-theme-section__meta">
                  <h5 className="catalog-theme-section__card-title">{item.title}</h5>
                </div>
              </Link>
            ))}
            {canShowMore ? (
              <button
                type="button"
                className="catalog-theme-section__nav"
                aria-label="Afficher 5 animes de plus"
                onClick={showMore}
              >
                <img
                  src="/fleche.svg"
                  alt=""
                  className="catalog-theme-section__nav-icon"
                  width={17}
                  height={27}
                />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
