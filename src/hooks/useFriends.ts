import { useCallback, useEffect, useState } from 'react'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingReceived,
  rejectFriendRequest,
  removeFriend,
  searchProfiles,
  sendFriendRequest,
} from '../lib/friends'
import type { FriendListItem, FriendRequestItem, SearchProfileResult } from '../types/friendship'

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<FriendListItem[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setFriends([])
      setPendingReceived([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [friendsList, pendingList] = await Promise.all([
        getFriends(userId),
        getPendingReceived(userId),
      ])
      setFriends(friendsList)
      setPendingReceived(pendingList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement amis.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function acceptRequest(friendshipId: string) {
    if (!userId) return
    await acceptFriendRequest(friendshipId, userId)
    await refresh()
  }

  async function rejectRequest(friendshipId: string) {
    if (!userId) return
    await rejectFriendRequest(friendshipId, userId)
    await refresh()
  }

  async function removeFriendById(friendshipId: string) {
    if (!userId) return
    await removeFriend(friendshipId, userId)
    await refresh()
  }

  async function sendRequest(addresseeId: string) {
    if (!userId) return
    await sendFriendRequest(userId, addresseeId)
    await refresh()
  }

  async function cancelRequest(friendshipId: string) {
    if (!userId) return
    await cancelFriendRequest(friendshipId, userId)
    await refresh()
  }

  async function searchUsers(query: string): Promise<SearchProfileResult[]> {
    if (!userId) return []
    return searchProfiles(query, userId)
  }

  return {
    friends,
    pendingReceived,
    loading,
    error,
    refresh,
    acceptRequest,
    rejectRequest,
    removeFriendById,
    sendRequest,
    cancelRequest,
    searchUsers,
  }
}
