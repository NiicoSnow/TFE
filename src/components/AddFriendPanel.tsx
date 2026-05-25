import { useEffect, useState } from 'react'
import { getRelation } from '../lib/friends'
import type { FriendRelation, SearchProfileResult } from '../types/friendship'

type AddFriendPanelProps = {
  currentUserId: string
  onClose: () => void
  onSearch: (query: string) => Promise<SearchProfileResult[]>
  onSendRequest: (userId: string) => Promise<void>
  onAcceptRequest: (friendshipId: string) => Promise<void>
}

export function AddFriendPanel({
  currentUserId,
  onClose,
  onSearch,
  onSendRequest,
  onAcceptRequest,
}: AddFriendPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProfileResult[]>([])
  const [relations, setRelations] = useState<Record<string, FriendRelation>>({})
  const [friendshipIds, setFriendshipIds] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setRelations({})
      setFriendshipIds({})
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const users = await onSearch(trimmed)
        if (cancelled) {
          return
        }
        setResults(users)
        const relationEntries = await Promise.all(
          users.map(async (user) => {
            const { relation, friendshipId } = await getRelation(currentUserId, user.id)
            return [user.id, relation, friendshipId] as const
          }),
        )
        if (cancelled) {
          return
        }
        setRelations(Object.fromEntries(relationEntries.map(([id, relation]) => [id, relation])))
        setFriendshipIds(
          Object.fromEntries(relationEntries.map(([id, , friendshipId]) => [id, friendshipId])),
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Recherche impossible.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, currentUserId, onSearch])

  const handleAction = async (user: SearchProfileResult) => {
    const relation = relations[user.id]
    const friendshipId = friendshipIds[user.id]
    setActionId(user.id)
    setError(null)
    try {
      if (relation === 'none') {
        await onSendRequest(user.id)
      } else if (relation === 'pending_received' && friendshipId) {
        await onAcceptRequest(friendshipId)
      }
      const { relation: nextRelation, friendshipId: nextId } = await getRelation(currentUserId, user.id)
      setRelations((prev) => ({ ...prev, [user.id]: nextRelation }))
      setFriendshipIds((prev) => ({ ...prev, [user.id]: nextId }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.')
    } finally {
      setActionId(null)
    }
  }

  const actionLabel = (relation: FriendRelation | undefined) => {
    switch (relation) {
      case 'accepted':
        return 'Déjà ami'
      case 'pending_sent':
        return 'Demande envoyée'
      case 'pending_received':
        return 'Accepter'
      default:
        return 'Ajouter'
    }
  }

  return (
    <div className="friends-add-panel" role="dialog" aria-labelledby="friends-add-title">
      <button type="button" className="friends-add-panel__backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="friends-add-panel__sheet">
        <div className="friends-add-panel__header">
          <h2 id="friends-add-title">Ajouter un ami</h2>
          <button type="button" className="friends-add-panel__close" onClick={onClose}>Fermer</button>
        </div>
        <input className="friends-add-panel__input" type="search" placeholder="Pseudo ou nom affiché…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        {error && <p className="profile-message profile-message--error">{error}</p>}
        {loading && <p className="friends-add-panel__hint">Recherche…</p>}
        {!loading && query.trim().length < 2 && <p className="friends-add-panel__hint">Tape au moins 2 caractères.</p>}
        <ul className="friends-add-panel__list">
          {results.map((user) => {
            const name = user.display_name ?? user.username ?? 'Utilisateur'
            const relation = relations[user.id]
            const disabled =
              relation === 'accepted' ||
              relation === 'pending_sent' ||
              actionId === user.id
            return (
              <li key={user.id} className="friends-add-panel__item">
                {user.avatar_url ? (
                  <img className="friends-add-panel__avatar" src={user.avatar_url} alt="" />
                ) : (
                  <div className="friends-add-panel__avatar friends-add-panel__avatar--placeholder" aria-hidden />
                )}
                <span className="friends-add-panel__name">{name}</span>
                <button type="button" className="profile-button friends-add-panel__action" disabled={disabled} onClick={() => handleAction(user)}>
                  {actionId === user.id ? '…' : actionLabel(relation)}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
