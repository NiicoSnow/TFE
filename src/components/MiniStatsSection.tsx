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
      <div className="ministats__element streak column">
        <img src="/infobulle.svg" alt="bulle d'information" className="ministats__element-infobulle" />
        <div className="ministats__element-streak">
          <img src="/streak.svg" alt="flamme symbolisant un streak" className="ministats__element-img" width={105} height={120} />
          <span className="ministats__number ministats__number--streak">12</span>
        </div>
        <h4 className="text-center">Tirages unique</h4>
      </div>
      <h4 className="seemore">Voir les statistiques complètes</h4>
    </section>
  )
}
