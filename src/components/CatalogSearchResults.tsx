import { Link } from 'react-router-dom'
import { displayTitle } from '../lib/animeCache'
import type { AnimeCacheSummary } from '../types/animeCache'

const POSTER_FALLBACK =
  'https://placehold.co/126x176/1e293b/9ca3af?text=Poster'

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

export function CatalogSearchResults({ query, results, loading, error }: CatalogSearchResultsProps) {
  return (
    <section className="catalogue-search grid">
      <p className="catalogue-search__count">{formatResultCount(results.length, query)}</p>
      {loading && <p className="catalogue-search__status">Recherche…</p>}
      {error && <p className="catalogue-search__status catalogue-search__status--error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="catalogue-search__status">Aucun anime trouvé dans le catalogue.</p>
      )}
      {!loading && !error && results.length > 0 && (
        <div className="catalog-theme-section__content catalogue-search__grid">
          <div className="catalog-theme-section__track">
            {results.map((row) => (
              <Link key={row.anilist_id} to={`/catalogue/anime/${row.anilist_id}`} className="catalog-theme-section__card">
                <figure className="catalog-theme-section__poster">
                  <img src={row.cover_url ?? POSTER_FALLBACK} alt="" loading="lazy" />
                </figure>
                <div className="catalog-theme-section__meta">
                  <h5 className="catalog-theme-section__card-title">{displayTitle(row)}</h5>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
