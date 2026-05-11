export function MiniStatsSection() {
  return (
    <section className="ministats grid">
      <h2>Mini stats</h2>
      <div className="ministats__element">
        <span className="ministats__number">84</span>
        <h4>Cartes tirés</h4>
      </div>
      <div className="ministats__element">
        <span className="ministats__number">51</span>
        <h4>Animes recommandés</h4>
      </div>
      <div className="ministats__element">
        <span className="ministats__number">17</span>
        <h4>Tirages fait</h4>
      </div>
      <div className="ministats__element">
        <span className="ministats__number">25</span>
        <h4>Animes reco ajoutés dans tes listes</h4>
      </div>
      <div className="ministats__element column">
        <h4>Tu es</h4>
        <span className="ministats__number">1/12</span>
        <h4 className="text-center">Parmi ta liste d'amis</h4>
      </div>
    </section>
  )
}
