import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimeManagtSection } from '../components/AnimeManagtSection'
import { useAuth } from '../hooks/useAuth'
import { getFriendProfileForViewer } from '../lib/friends'
import { getQueryErrorMessage } from '../lib/animeCache'
import { displayProfileName, formatMemberSince } from '../lib/profileDisplay'
import type { FriendProfile } from '../lib/friends'
import { publicAsset } from '../lib/publicPath'

export function SingleFriendPage() {
  const { userId: friendUserId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<FriendProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!friendUserId || !user?.id) {
      setLoading(false)
      return
    }

    const viewerId = user.id
    const targetId = friendUserId
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const row = await getFriendProfileForViewer(viewerId, targetId)
        if (!cancelled) {
          setProfile(row)
          if (!row) {
            setError('Profil introuvable ou cet utilisateur n’est pas dans tes amis.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getQueryErrorMessage(err, 'Profil introuvable'))
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [friendUserId, user?.id])

  if (!authLoading && !user) {
    return <Navigate to="/profil" replace />
  }

  return (
    <main className="single-friend-page">
      <div className="single-friend-page__intro">
        <Link to="/amis" className="single-friend-page__back" aria-label="Retour aux amis">
          <img
            src={publicAsset('assets/fleche.svg')}
            alt=""
            className="single-friend-page__back-icon"
            width={17}
            height={27}
          />
        </Link>

        <div className="single-friend-page__profile">
          {loading ? <p className="single-friend-page__status">Chargement…</p> : null}
          {error ? (
            <p className="single-friend-page__status single-friend-page__status--error">{error}</p>
          ) : null}

          {!loading && !error && profile ? (
            <header className="profile-view profile-view--readonly">
              <h3 className="profile-view__name">{displayProfileName(profile)}</h3>
              <div className="profile-view__avatar-wrap">
                {profile.avatar_url ? (
                  <img className="profile-view__avatar" src={profile.avatar_url} alt="" />
                ) : (
                  <div className="profile-view__avatar profile-view__avatar--placeholder" aria-hidden />
                )}
              </div>
              <h5 className="profile-view__since">
                Membre depuis le {formatMemberSince(profile.created_at)}
              </h5>
            </header>
          ) : null}
        </div>
      </div>

      {!loading && !error && profile ? (
        <AnimeManagtSection
          libraryUserId={profile.id}
          readOnly
          heading={`Les listes de ${displayProfileName(profile)}`}
          libraryPublic={profile.library_public ?? true}
          ownerDisplayName={displayProfileName(profile)}
        />
      ) : null}
    </main>
  )
}
