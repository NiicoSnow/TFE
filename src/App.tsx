import { NavLink, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'
import { useState } from 'react'
import { StatsPage } from './pages/StatsPage'
import { CataloguePage} from './pages/CataloguePage'
import { FriendsPage} from './pages/FriendsPage'
import { CardsPage} from './pages/CardsPage'

supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error.message)
      return
    }

    console.log('Supabase connected:', {
      hasSession: Boolean(data.session),
    })
  })

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav className="main-nav">
        <button className="menu-button" type="button" aria-label="Ouvrir le menu" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={isMenuOpen ? "nav-links open" : "nav-links"}>
          <NavLink to="/" onClick ={ () => setIsMenuOpen(false)}>Accueil</NavLink>
          <NavLink to="/catalogue" onClick ={ () => setIsMenuOpen(false)}>Catalogue</NavLink>
          <NavLink to="/cartes" onClick ={ () => setIsMenuOpen(false)}>Cartes</NavLink>
          <NavLink to="/stats" onClick ={ () => setIsMenuOpen(false)}>Stats</NavLink>
          <NavLink to="/amis" onClick ={ () => setIsMenuOpen(false)}>Amis</NavLink>
          <NavLink to="/profil" onClick ={ () => setIsMenuOpen(false)}>Profil</NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/amis" element={<FriendsPage />} />
        <Route path="/cartes" element={<CardsPage />} />
      </Routes>
    </>
  )
}

export default App
