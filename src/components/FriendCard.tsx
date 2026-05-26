import { Link } from 'react-router-dom'
import type { FriendListItem } from '../types/friendship'
import { displayProfileName } from '../lib/profileDisplay'

type FriendCardProps = {
  friend: FriendListItem
  onRemove: (friendshipId: string) => void
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const name = displayProfileName(friend.profile)

  return (
    <article className="friend-card">
      {friend.profile.avatar_url ? (
        <img className="friend-card__avatar" src={friend.profile.avatar_url} alt="" />
      ) : (
        <div className="friend-card__avatar friend-card__avatar--placeholder" aria-hidden />
      )}
      <h3 className="friend-card__name">{name}</h3>
      <div className="friend-card__actions">
        <button type="button" className="friend-card__action" aria-label={`Retirer ${name} de mes amis`} onClick={() => onRemove(friend.friendshipId)}>
          <img src="/delfriends.svg" alt="" width={30} height={30} />
        </button>
        <Link
          to={`/amis/${friend.profile.id}`}
          className="friend-card__action"
          aria-label={`Voir le profil de ${name}`}
        >
          <img src="/seefriends.svg" alt="" width={30} height={30} />
        </Link>
      </div>
    </article>
  )
}
