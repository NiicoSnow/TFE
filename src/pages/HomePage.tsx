export function HomePage() {
  return (
    <>
      <section className="tuto grid">
        <h2>Explication du concept</h2>
        <div className="tuto__element">
          <div className="tuto__element-img"></div>
          <h3>Lance ton tirage</h3>
          <p>Appuie sur le bouton central pour démarrer l'expérience. En quelques secondes, tu accèdes à un parcours interactif basé sur des choix simples, mais révélateurs.</p>
          <p>Ici, pas de recherche classique : tu te laisses guider.</p>
        </div>
        <div className="tuto__element">
          <div className="tuto__element-img"></div>
          <h3>Fais tes choix</h3>
          <p>Découvre une série de cartes avec des questions originales et inattendues. Chaque choix que tu fais affine ton profil et influence les recommandations.</p>
          <p>Univers, émotions, situations, styles… On te pose des questions différentes pour aller au-delà des filtres classiques.</p>
        </div>
        <div className="tuto__element">
          <div className="tuto__element-img"></div>
          <h3>Ton résultat personnalisé</h3>
          <p>À la fin du tirage, tu obtiens une sélection unique qui te correspond vraiment. Chaque résultat est construit à partir de tes choix, pour te proposer quelque chose de cohérent, mais aussi surprenant.</p>
        </div>
      </section>
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
          <h4 className ="text-center">Parmi ta liste d'amis</h4>
        </div>
      </section>
    </>
  )
}
