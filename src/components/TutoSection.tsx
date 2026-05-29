import { publicAsset } from '../lib/publicPath'

export function TutoSection() {
  return (
    <section id="explications" className="tuto grid">
      <h2>Explications du concept</h2>
      <div className="tuto__element">
        <div className="tuto__element-media">
          <img
            className="tuto__element-img"
            src={publicAsset('assets/Tuto1.webp')}
            alt="Illustration : lancer le tirage de cartes sur Cardtaku"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="tuto__element-content">
          <h3>Lance ton tirage</h3>
          <p>
            Appuie sur le bouton central pour démarrer l'expérience. En un seul clic, tu accèdes à un parcours interactif basé sur des choix simples, mais révélateurs.
          </p>
          <p><span className="font-bold">Ici, pas de recherche classique : tu te laisses guider.</span></p>
        </div>
      </div>
      <div className="tuto__element tuto__element--reverse">
        <div className="tuto__element-media">
          <img
            className="tuto__element-img"
            src={publicAsset('assets/Tuto2.webp')}
            alt="Illustration : choisir entre les cartes du quiz"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="tuto__element-content">
          <h3>Fais tes choix</h3>
          <p>
            Découvre une série de cartes avec des questions originales et inattendues. Chaque choix que tu fais affine ton profil et influence les recommandations.
          </p>
          <p>
            <span className="font-bold">Univers, émotions, situations, styles…</span> On te pose des questions différentes pour aller au-delà des filtres classiques.
          </p>
        </div>
      </div>
      <div className="tuto__element">
        <div className="tuto__element-media">
          <img
            className="tuto__element-img"
            src={publicAsset('assets/Tuto3.webp')}
            alt="Illustration : résultats personnalisés avec affinités"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="tuto__element-content">
          <h3>Ton résultat personnalisé</h3>
          <p>
          À la fin du tirage, tu obtiens une sélection unique, pensée pour vraiment te correspondre. Chaque résultat est généré à partir de tes choix et traduit sous forme d'affinités avec différents animes, afin de te proposer quelque chose à la fois cohérent et surprenant. <span className="font-bold">Plus une affinité est élevée, plus l'anime correspondra à tes choix.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
