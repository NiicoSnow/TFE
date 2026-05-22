import { Cards } from '../components/Cards'

export function CardsPage() {
  return (
    <section className="cards-page grid">
      <header className="cards-page__header">
        <h1>Quiz personnalisé</h1>
        <p>Choisis les cartes que tu préfères — on te proposera des animes à la fin.</p>
      </header>
      <Cards />
    </section>
  )
}