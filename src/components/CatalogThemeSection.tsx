import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
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
const DESKTOP_CATALOG_MQ = '(min-width: 1024px)'

function mapToTrendItem(row: AnimeCacheSummary): CatalogTrendItem {
  return {
    id: String(row.anilist_id),
    title: displayTitle(row),
    poster: row.cover_url ?? POSTER_FALLBACK,
  }
}

export function CatalogThemeSection(props: CatalogSectionProps) {
  const isDesktop = useMediaQuery(DESKTOP_CATALOG_MQ)
  const [items, setItems] = useState<CatalogTrendItem[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [slideIndex, setSlideIndex] = useState(0)
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
          setSlideIndex(0)
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

  const totalPages = Math.max(1, Math.ceil(maxVisible / PAGE_SIZE))

  useEffect(() => {
    setSlideIndex((index) => Math.min(index, totalPages - 1))
  }, [totalPages])

  const showMore = () => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, maxVisible))
  }

  const isFullyExpanded = visibleCount >= maxVisible

  const toggleSeeAll = () => {
    setVisibleCount(isFullyExpanded ? PAGE_SIZE : maxVisible)
    setSlideIndex(0)
  }

  const desktopItems = items.slice(slideIndex * PAGE_SIZE, slideIndex * PAGE_SIZE + PAGE_SIZE)
  const mobileItems = items.slice(0, visibleCount)
  const displayItems = isDesktop ? desktopItems : mobileItems

  const canShowMoreMobile = !isDesktop && visibleCount < maxVisible
  const canGoNextDesktop = isDesktop && slideIndex < totalPages - 1
  const canGoPrevDesktop = isDesktop && slideIndex > 0
  const canToggleSeeAll = !isDesktop && maxVisible > PAGE_SIZE

  const sectionClassName = props.embedded
    ? 'catalog-theme-section catalog-theme-section--embedded'
    : 'catalog-theme-section grid'

  const contentClassName = isDesktop
    ? 'catalog-theme-section__content catalog-theme-section__content--slider'
    : 'catalog-theme-section__content'

  const blockClassName = isDesktop
    ? 'catalog-theme-section__block'
    : 'catalog-theme-section__block catalog-theme-section__block--mobile'

  return (
    <section className={sectionClassName} aria-busy={loading}>
      <div className={blockClassName}>
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

        {!loading && !error && displayItems.length > 0 ? (
          <div className={contentClassName}>
            {isDesktop ? (
              <button
              type="button"
              className={
                canGoPrevDesktop
                  ? 'catalog-theme-section__nav catalog-theme-section__nav--prev'
                  : 'catalog-theme-section__nav catalog-theme-section__nav--prev catalog-theme-section__nav--placeholder'
              }
              aria-label="Afficher les 5 animes précédents"
              aria-hidden={!canGoPrevDesktop}
              tabIndex={canGoPrevDesktop ? 0 : -1}
              disabled={!canGoPrevDesktop}
              onClick={() => setSlideIndex((i) => i - 1)}
            >
              <img
                src="/assets/fleche.svg"
                alt=""
                className="catalog-theme-section__nav-icon catalog-theme-section__nav-icon--left"
                width={17}
                height={27}
              />
              </button>
            ) : null}

            <div
            key={isDesktop ? slideIndex : 'mobile'}
            className={
              isDesktop
                ? 'catalog-theme-section__track catalog-theme-section__track--slide'
                : 'catalog-theme-section__track'
            }
            >
              {displayItems.map((item) => (
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
            </div>

            {isDesktop ? (
              <button
              type="button"
              className={
                canGoNextDesktop
                  ? 'catalog-theme-section__nav catalog-theme-section__nav--next'
                  : 'catalog-theme-section__nav catalog-theme-section__nav--next catalog-theme-section__nav--placeholder'
              }
              aria-label="Afficher les 5 animes suivants"
              aria-hidden={!canGoNextDesktop}
              tabIndex={canGoNextDesktop ? 0 : -1}
              disabled={!canGoNextDesktop}
              onClick={() => setSlideIndex((i) => i + 1)}
            >
              <img
                src="/assets/fleche.svg"
                alt=""
                className="catalog-theme-section__nav-icon"
                width={17}
                height={27}
              />
              </button>
            ) : null}

            {canShowMoreMobile ? (
            <button
              type="button"
              className="catalog-theme-section__nav"
              aria-label="Afficher 5 animes de plus"
              onClick={showMore}
            >
              <img
                src="/assets/fleche.svg"
                alt=""
                className="catalog-theme-section__nav-icon"
                width={17}
                height={27}
              />
            </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
