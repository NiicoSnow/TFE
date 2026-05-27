import { NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { StatsPage } from './pages/StatsPage'
import { CataloguePage} from './pages/CataloguePage'
import { SingleAnimePage } from './pages/SingleAnimePage'
import { FriendsPage} from './pages/FriendsPage'
import { SingleFriendPage } from './pages/SingleFriendPage'
import { CardsPage} from './pages/CardsPage'
import { CreditsPage } from './pages/CreditsPage'
import { Footer } from './components/Footer'
import { MainNavUser } from './components/MainNavUser'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLButtonElement>(null)

  const closeMenu = () => {
    if (!isMenuOpen) {
      return
    }

    if (!menuRef.current) {
      setIsMenuOpen(false)
      return
    }

    gsap.to(menuRef.current, {
      xPercent: -100,
      duration: 0.25,
      ease: 'power3.in',
      onComplete: () => setIsMenuOpen(false),
    })

    if (backdropRef.current) {
      gsap.to(backdropRef.current, {
        autoAlpha: 0,
        duration: 0.25,
        ease: 'power2.in',
      })
    }
  }

  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) {
      return
    }

    gsap.fromTo(
      menuRef.current,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.45, ease: 'power3.out' },
    )

    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: 'power2.out' },
      )
    }
  }, [isMenuOpen])

  return (
    <>
      <nav className={isMenuOpen ? 'main-nav menu-open' : 'main-nav'}>
        <div className="main-nav__wrapper">
          <button className="menu-button" type="button" aria-label="Ouvrir le menu" aria-expanded={isMenuOpen} onClick={() => isMenuOpen ? closeMenu() : setIsMenuOpen(true)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div ref={menuRef} className={isMenuOpen ? "nav-links open" : "nav-links"}>
          <img src="/Cardtaku.svg" alt="Cardtaku" className="main-nav__logo" />
            <div className="nav-links__group">
              <NavLink to="/" onClick ={closeMenu}>Accueil</NavLink>
              <NavLink to="/catalogue" onClick ={closeMenu}>Catalogue</NavLink>
              <NavLink to="/cartes" className="nav-links__cartes" onClick={closeMenu} aria-label="Cartes">
                <img src="/cards.svg" alt="" className="nav-links__cartes-icon" width={39} height={35} />
              </NavLink>
              <NavLink to="/stats" onClick ={closeMenu}>Stats</NavLink>
              <NavLink to="/amis" onClick ={closeMenu}>Amis</NavLink>
            </div>
          </div>
          <MainNavUser />
        </div>
      </nav>
      {isMenuOpen && (
        <button
          ref={backdropRef}
          className="menu-backdrop"
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMenu}
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/catalogue/anime/:anilistId" element={<SingleAnimePage />} />
        <Route path="/amis" element={<FriendsPage />} />
        <Route path="/amis/:userId" element={<SingleFriendPage />} />
        <Route path="/cartes" element={<CardsPage />} />
        <Route path="/credits" element={<CreditsPage />} />
      </Routes>

      <Footer />
    </>
  )
}

export default App
