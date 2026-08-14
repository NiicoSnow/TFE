import { useCallback, useEffect, useState } from 'react'
import { fetchUserQuizStats } from '../lib/quizStats'
import type { UserQuizStats } from '../types/stats'
import { useAuth } from './useAuth'

export function useStats() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<UserQuizStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStats(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserQuizStats(user.id)
      setStats(data)
    } catch (err) {
      setStats(null)
      setError(err instanceof Error ? err.message : 'Impossible de charger les stats.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  return {
    user,
    authLoading,
    stats,
    loading: authLoading || loading,
    error,
    refresh,
  }
}
