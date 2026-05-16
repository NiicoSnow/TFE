import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'signup'

export function ProfileAuthForm() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const { needsEmailConfirmation } = await signUp({ email, password, username, displayName })

        if (needsEmailConfirmation) {
          setInfo('Compte créé. Vérifiez votre boîte mail pour confirmer l’inscription, puis connectez-vous.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="profile-auth">
      <div className="profile-auth__tabs">
        <button type="button" className={mode === 'signin' ? 'profile-auth__tab profile-auth__tab--active' : 'profile-auth__tab'} onClick={() => setMode('signin')}>Connexion</button>
        <button type="button" className={mode === 'signup' ? 'profile-auth__tab profile-auth__tab--active' : 'profile-auth__tab'} onClick={() => setMode('signup')}>Inscription</button>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <label className="profile-field">
              <span>Pseudo</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </label>
            <label className="profile-field">
              <span>Nom affiché</span>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required autoComplete="name" />
            </label>
          </>
        )}

        <label className="profile-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>

        <label className="profile-field">
          <span>Mot de passe</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
        </label>

        {error && <p className="profile-message profile-message--error">{error}</p>}
        {info && <p className="profile-message profile-message--info">{info}</p>}

        <button className="profile-button" type="submit" disabled={submitting}>
          {submitting ? 'Chargement…' : mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
        </button>
      </form>
    </div>
  )
}
