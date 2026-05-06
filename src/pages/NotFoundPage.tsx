import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section id="center">
      <div>
        <h1>Page introuvable</h1>
        <p>Cette page n'existe pas.</p>
        <Link to="/">Retour a l'accueil</Link>
      </div>
    </section>
  )
}
