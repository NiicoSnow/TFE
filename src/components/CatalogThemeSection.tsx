export type CatalogTrendItem = {
  id: string
  title: string
  poster: string
}

/** Données temporaires — à remplacer par l'API */
const PLACEHOLDER_ITEMS: CatalogTrendItem[] = [
  { id: '1', title: 'Jujutsu Kaisen Saison 3', poster: 'https://placehold.co/126x176/1e293b/9ca3af?text=Poster' },
  { id: '2', title: 'Frieren Saison 2', poster: 'https://placehold.co/126x176/1e293b/9ca3af?text=Poster' },
  { id: '3', title: "Hell's Paradise Saison 2", poster: 'https://placehold.co/126x176/1e293b/9ca3af?text=Poster' },
  { id: '4', title: 'Sentenced to Be a Hero', poster: 'https://placehold.co/126x176/1e293b/9ca3af?text=Poster' },
  { id: '5', title: '[Oshi No Ko] Saison 3', poster: 'https://placehold.co/126x176/1e293b/9ca3af?text=Poster' },
]

export function CatalogThemeSection({ items = PLACEHOLDER_ITEMS }: { items?: CatalogTrendItem[] }) {
  return (
    <section className="catalog-theme-section grid">
      <header className="catalog-theme-section__header flex justify-between items-end">
        <h2 className="catalog-theme-section__title">Tendance cette année</h2>
        <a href="#" className="catalog-theme-section__seemore seemore">
          Voir tout
        </a>
      </header>

      <div className="catalog-theme-section__content">
        <div className="catalog-theme-section__track">
          {items.map((item) => (
            <article key={item.id} className="catalog-theme-section__card">
              <figure className="catalog-theme-section__poster">
                <img src={item.poster} alt="" />
              </figure>
              <div className="catalog-theme-section__meta">
                <h5 className="catalog-theme-section__card-title">{item.title}</h5>
              </div>
            </article>
          ))}
        </div>
        <button type="button" className="catalog-theme-section__nav" aria-label="Afficher la suite">
          <img src="/fleche.svg" alt="" className="catalog-theme-section__nav-icon" width={17} height={27} />
        </button>
      </div>
    </section>
  )
}
