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

  const busy = actionId !== null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, busy])

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
    <div className="anime-management__modal-root">
      <button
        type="button"
        className="anime-management__modal-backdrop"
        aria-label="Fermer"
        onClick={onClose}
        disabled={busy}
      />
      <div
        className="anime-management__modal friends-add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-add-title"
      >
        <h3 id="friends-add-title" className="anime-management__modal-title">
          Ajouter un ami
        </h3>
        <input
          className="friends-add-modal__input"
          type="search"
          placeholder="Pseudo ou nom affiché…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {error ? <p className="profile-message profile-message--error">{error}</p> : null}
        {loading ? <p className="friends-add-modal__hint">Recherche…</p> : null}
        {!loading && query.trim().length < 2 ? (
          <p className="friends-add-modal__hint">Tape au moins 2 caractères.</p>
        ) : null}
        <ul className="friends-add-modal__list">
          {results.map((user) => {
            const name = user.display_name ?? user.username ?? 'Utilisateur'
            const relation = relations[user.id]
            const disabled =
              relation === 'accepted' ||
              relation === 'pending_sent' ||
              actionId === user.id
            return (
              <li key={user.id} className="friends-add-modal__item">
                {user.avatar_url ? (
                  <img className="friends-add-modal__avatar" src={user.avatar_url} alt="" />
                ) : (
                  <div
                    className="friends-add-modal__avatar friends-add-modal__avatar--placeholder"
                    aria-hidden
                  />
                )}
                <span className="friends-add-modal__name">{name}</span>
                <button
                  type="button"
                  className="profile-button friends-add-modal__action"
                  disabled={disabled}
                  onClick={() => handleAction(user)}
                >
                  {actionId === user.id ? '…' : actionLabel(relation)}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          className="anime-management__modal-cancel"
          onClick={onClose}
          disabled={busy}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
