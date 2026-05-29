import { Cards } from '../components/Cards'

export function CardsPage() {
  return (
    <section className="cards-page grid">
      <header className="cards-page__header">
        <h1>Quiz personnalisé</h1>
        <p>Choisis les cartes que tu préfères, on te proposera une sélection d'animes qui correspondra à tes choix.</p>
      </header>
      <Cards />
    </section>
  )
}