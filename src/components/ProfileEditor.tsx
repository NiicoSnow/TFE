import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { Profile } from '../types/profile'

type ProfileEditorProps = {
  profile: Profile
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const { user, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState(() => profile.username ?? '')
  const [displayName, setDisplayName] = useState(() => profile.display_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(() => profile.avatar_url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      await updateProfile({
        username: username.trim() || undefined,
        display_name: displayName.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      })
      setSuccess('Profil mis à jour.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <div className="profile-card">
      <p className="profile-card__email">{user?.email}</p>
      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="profile-field">
          <span>Pseudo</span>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="profile-field">
          <span>Nom affiché</span>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label className="profile-field">
          <span>URL avatar (optionnel)</span>
          <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        </label>
        {profile.avatar_url && <img className="profile-card__avatar" src={profile.avatar_url} alt="" />}
        {error && <p className="profile-message profile-message--error">{error}</p>}
        {success && <p className="profile-message profile-message--info">{success}</p>}
        <button className="profile-button" type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
      <button className="profile-button profile-button--secondary" type="button" onClick={handleSignOut}>Se déconnecter</button>
    </div>
  )
}
