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
      setError(err instanceof Error ? err.message : 'Impossible de charger les amis.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const acceptRequest = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return
      }
      await acceptFriendRequest(friendshipId, userId)
      await refresh()
    },
    [refresh, userId],
  )

  const rejectRequest = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return
      }
      await rejectFriendRequest(friendshipId, userId)
      await refresh()
    },
    [refresh, userId],
  )

  const removeFriendById = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return
      }
      await removeFriend(friendshipId, userId)
      await refresh()
    },
    [refresh, userId],
  )

  const sendRequest = useCallback(
    async (addresseeId: string) => {
      if (!userId) {
        return
      }
      await sendFriendRequest(userId, addresseeId)
      await refresh()
    },
    [refresh, userId],
  )

  const cancelRequest = useCallback(
    async (friendshipId: string) => {
      if (!userId) {
        return
      }
      await cancelFriendRequest(friendshipId, userId)
      await refresh()
    },
    [refresh, userId],
  )

  const searchUsers = useCallback(
    async (query: string): Promise<SearchProfileResult[]> => {
      if (!userId) {
        return []
      }
      return searchProfiles(query, userId)
    },
    [userId],
  )

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
