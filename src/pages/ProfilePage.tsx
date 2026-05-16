import { ProfileAuthForm } from '../components/ProfileAuthForm'
import { ProfileEditor } from '../components/ProfileEditor'
import { useAuth } from '../hooks/useAuth'

export function ProfilePage() {
  const { user, profile, profileError, loading, refreshProfile } = useAuth()

  return (
    <section className="center profile-page grid">
      <div>
        <h1>Profil</h1>

        {loading ? (
          <p>Chargement…</p>
        ) : !user ? (
          <ProfileAuthForm />
        ) : !profile ? (
          <div className="profile-card">
            <p>Profil introuvable.</p>
            {profileError && <p className="profile-message profile-message--error">{profileError}</p>}
            {user && <p className="profile-card__email">ID session : {user.id}</p>}
            <button className="profile-button" type="button" onClick={() => refreshProfile()}>Réessayer</button>
          </div>
        ) : (
          <ProfileEditor key={profile.updated_at} profile={profile} />
        )}
      </div>
    </section>
  )
}
