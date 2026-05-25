import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AddFriendPanel } from '../components/AddFriendPanel'
import { FriendCard } from '../components/FriendCard'
import { PendingFriendRequests } from '../components/PendingFriendRequests'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'

function formatFriendsCount(count: number) {
  if (count <= 1) {
    return `${count} ami`
  }
  return `${count} amis`
}

export function FriendsPage() {
  const { user, loading: authLoading } = useAuth()
  const {
    friends,
    pendingReceived,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    removeFriendById,
    sendRequest,
    searchUsers,
  } = useFriends(user?.id)

  const [search, setSearch] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return friends
    }
    return friends.filter((friend) => {
      const username = friend.profile.username?.toLowerCase() ?? ''
      const displayName = friend.profile.display_name?.toLowerCase() ?? ''
      return username.includes(q) || displayName.includes(q)
    })
  }, [friends, search])

  if (!authLoading && !user) {
    return <Navigate to="/profil" replace />
  }

  const handleRemove = async (friendshipId: string) => {
    setBusyId(friendshipId)
    setActionError(null)
    try {
      await removeFriendById(friendshipId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de retirer cet ami.')
    } finally {
      setBusyId(null)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    setBusyId(friendshipId)
    setActionError(null)
    try {
      await acceptRequest(friendshipId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible d’accepter la demande.')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (friendshipId: string) => {
    setBusyId(friendshipId)
    setActionError(null)
    try {
      await rejectRequest(friendshipId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de refuser la demande.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="friends-page grid">
      <div className="friends-page__inner">
        <div className="friends-toolbar">
          <label className="friends-toolbar__search">
            <img src="/loupe.svg" alt="" className="friends-toolbar__search-icon" width={21} height={21} />
            <input type="search" className="friends-toolbar__input" placeholder="Rechercher" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <button type="button" className="friends-toolbar__add" aria-label="Ajouter un ami" onClick={() => setShowAddPanel(true)}>
            <img src="/adding.svg" alt="" width={24} height={24} />
          </button>
        </div>

        <p className="friends-page__count">{formatFriendsCount(friends.length)}</p>

        {(error || actionError) && (
          <p className="profile-message profile-message--error">{error ?? actionError}</p>
        )}

        <PendingFriendRequests requests={pendingReceived} onAccept={handleAccept} onReject={handleReject} busyId={busyId} />

        {authLoading || loading ? (
          <p className="friends-page__empty">Chargement…</p>
        ) : filteredFriends.length === 0 ? (
          <p className="friends-page__empty">
            {friends.length === 0 ? 'Tu n’as pas encore d’amis. Utilise le bouton + pour en ajouter.' : 'Aucun ami ne correspond à ta recherche.'}
          </p>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map((friend) => (
              <FriendCard key={friend.friendshipId} friend={friend} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>

      {showAddPanel && user && (
        <AddFriendPanel
          currentUserId={user.id}
          onClose={() => setShowAddPanel(false)}
          onSearch={searchUsers}
          onSendRequest={sendRequest}
          onAcceptRequest={acceptRequest}
        />
      )}
    </section>
  )
}
