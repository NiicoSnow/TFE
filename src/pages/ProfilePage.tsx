import { AnimeManagtSection } from '../components/AnimeManagtSection'
import { ProfileAuthForm } from '../components/ProfileAuthForm'
import { ProfileView } from '../components/ProfileView'
import { useAuth } from '../hooks/useAuth'

export function ProfilePage() {
  const { user, profile, profileError, loading, refreshProfile } = useAuth()

  return (
    <section className="profile-page">
      <div>
        {loading ? (
          <>
            <h1>Profil</h1>
            <p>Chargement…</p>
          </>
        ) : !user ? (
          <>
            <h1>Profil</h1>
            <ProfileAuthForm />
          </>
        ) : !profile ? (
          <>
            <h1>Profil</h1>
            <div className="profile-card">
              <p>Profil introuvable.</p>
              {profileError && <p className="profile-message profile-message--error">{profileError}</p>}
              {user && <p className="profile-card__email">ID session : {user.id}</p>}
              <button className="profile-button" type="button" onClick={() => refreshProfile()}>Réessayer</button>
            </div>
          </>
        ) : (
          <ProfileView profile={profile} />
        )}
      </div>
      <AnimeManagtSection />
    </section>
  )
}
