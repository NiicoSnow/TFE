import { useEffect, useState } from 'react'
import { fetchUserQuizStats } from '../lib/quizStats'
import type { UserQuizStats } from '../types/stats'

export function useFriendPageStats(viewerId: string | undefined, friendUserId: string | undefined) {
  const [viewerStats, setViewerStats] = useState<UserQuizStats | null>(null)
  const [friendStats, setFriendStats] = useState<UserQuizStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!viewerId || !friendUserId) {
      setViewerStats(null)
      setFriendStats(null)
      setLoading(false)
      return
    }

    const viewer = viewerId
    const friend = friendUserId
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [viewerData, friendData] = await Promise.all([
          fetchUserQuizStats(viewer),
          fetchUserQuizStats(friend),
        ])
        if (!cancelled) {
          setViewerStats(viewerData)
          setFriendStats(friendData)
        }
      } catch (err) {
        if (!cancelled) {
          setViewerStats(null)
          setFriendStats(null)
          setError(err instanceof Error ? err.message : 'Impossible de charger les stats.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [viewerId, friendUserId])

  return { viewerStats, friendStats, loading, error }
}
