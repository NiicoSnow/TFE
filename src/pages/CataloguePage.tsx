import { CatalogThemeSection } from '../components/CatalogThemeSection'

export function CataloguePage() {
  return (
    <section className="catalogue-page">
      <CatalogThemeSection variant="trending-year" />
      <CatalogThemeSection variant="trending-all-time" />
      <CatalogThemeSection variant="upcoming" />
    </section>
  )
}
