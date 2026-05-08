import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="center">
      <div>
        <h1>Page introuvable</h1>
        <p>Cette page n'existe pas.</p>
        <Link to="/">Retour a l'accueil</Link>
      </div>
    </section>
  )
}
