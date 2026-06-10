import { useNavigate } from 'react-router-dom'
import { AnimeManagtSection } from '../components/AnimeManagtSection'
import { publicAsset } from '../lib/publicPath'
// import { MiniStatsSection } from '../components/MiniStatsSection'
import { TutoSection } from '../components/TutoSection'
// import { VersusSection } from '../components/VersusSection'

export function HomePage() {
  const navigate = useNavigate()

  const scrollToExplications = () => {
    document.getElementById('explications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="home-page">
      <header className="home-page__header grid">
        <div className="home-page__header-content">
          <h1 className="home-page__header-title">
            <img
              className="home-page__header-logo"
              src={publicAsset('assets/Cardtaku.svg')}
              alt="Cardtaku"
              width={148}
              height={28}
            />
          </h1>
          <p>Tu en as marre de ne jamais savoir quoi regarder ? Cardtaku est la solution !
            Grâce à Cardtaku, découvre de nouveaux animes adaptés à tes goûts et à tes envies.
            Ajoute ensuite les animes recommandés dans l’une de tes 4 listes pour les retrouver facilement et organiser tes découvertes !
          </p>
          <div className="home-page__header-buttons">
            <button type="button" className="home-page__header-button home-page__header-button--muted" onClick={scrollToExplications}>
              Explications
            </button>
            <button type="button" className="home-page__header-button home-page__header-button--accent" onClick={() => navigate('/cartes')}>
              Essayer
            </button>
          </div>
        </div>
        <div className="home-page__header-media">
          <img
            className="home-page__header-img"
            src={publicAsset('assets/mockup.webp')}
            alt="Aperçu de l'application Cardtaku sur mobile"
            width={600}
            height={800}
            loading="eager"
            decoding="async"
          />
        </div>
      </header>
      <TutoSection />
      {/* <MiniStatsSection />  
      <VersusSection /> */}
      <AnimeManagtSection />
    </main>
  )
}
