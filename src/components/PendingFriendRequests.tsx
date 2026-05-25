import type { FriendRequestItem } from '../types/friendship'

type PendingFriendRequestsProps = {
  requests: FriendRequestItem[]
  onAccept: (friendshipId: string) => void
  onReject: (friendshipId: string) => void
  busyId: string | null
}

export function PendingFriendRequests({ requests, onAccept, onReject, busyId }: PendingFriendRequestsProps) {
  if (requests.length === 0) {
    return null
  }

  return (
    <section className="friends-requests">
      <h2 className="friends-requests__title">Demandes reçues</h2>
      <ul className="friends-requests__list">
        {requests.map((request) => {
          const name = request.profile.display_name ?? request.profile.username ?? 'Utilisateur'
          const busy = busyId === request.friendshipId
          return (
            <li key={request.friendshipId} className="friends-requests__item">
              {request.profile.avatar_url ? (
                <img className="friends-requests__avatar" src={request.profile.avatar_url} alt="" />
              ) : (
                <div className="friends-requests__avatar friends-requests__avatar--placeholder" aria-hidden />
              )}
              <span className="friends-requests__name">{name}</span>
              <div className="friends-requests__actions">
                <button type="button" className="friends-requests__btn friends-requests__btn--accept" disabled={busy} onClick={() => onAccept(request.friendshipId)}>Accepter</button>
                <button type="button" className="friends-requests__btn friends-requests__btn--reject" disabled={busy} onClick={() => onReject(request.friendshipId)}>Refuser</button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
