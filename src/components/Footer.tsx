import { NavLink } from 'react-router-dom'

const FOOTER_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/cartes', label: 'Cartes' },
  { to: '/stats', label: 'Stats' },
  { to: '/amis', label: 'Amis' },
  { to: '/credits', label: 'Crédits' },
] as const

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer__nav" aria-label="Navigation du pied de page">
        {FOOTER_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} className="footer__link">
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="footer__copy">© 2026 Cardtaku. Tous droits réservés.</p>
    </footer>
  )
}
