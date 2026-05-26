import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'
import { AuthContext, type AuthContextValue } from './auth-context'

function clearProfileState(
  setProfile: (value: Profile | null) => void,
  setProfileError: (value: string | null) => void,
) {
  setProfile(null)
  setProfileError(null)
}

async function validateSessionClaims(): Promise<boolean> {
  const { data, error } = await supabase.auth.getClaims()
  return !error && Boolean(data?.claims?.sub)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      if (!nextSession) {
        clearProfileState(setProfile, setProfileError)
        setProfileLoading(false)
      }

      if (event === 'INITIAL_SESSION') {
        setAuthReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = useCallback(async (userId: string) => {
    setProfileError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setProfile(null)
      setProfileError(error.message)
      return
    }

    if (!data) {
      setProfile(null)
      setProfileError(
        'Aucune ligne dans profiles pour cet utilisateur. Vérifiez que l’id correspond à Authentication → Users.',
      )
      return
    }

    setProfile(data as Profile)
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfileLoading(false)
      return
    }

    let cancelled = false

    void (async () => {
      setProfileLoading(true)

      const claimsValid = await validateSessionClaims()
      if (cancelled) {
        return
      }

      if (!claimsValid) {
        setProfile(null)
        setProfileError('Session invalide ou expirée.')
        setProfileLoading(false)
        return
      }

      await loadProfile(userId)
      if (!cancelled) {
        setProfileLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, loadProfile])

  const signUp = useCallback(
    async ({
      email,
      password,
      username,
      displayName,
    }: {
      email: string
      password: string
      username: string
      displayName: string
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      })

      if (error) {
        throw error
      }

      return { needsEmailConfirmation: !data.session }
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [])

  const updateProfile = useCallback(
    async (updates: {
      username?: string
      display_name?: string
      avatar_url?: string
      library_public?: boolean
    }) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Non connecté')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      setProfile(data as Profile)
      setProfileError(null)
    },
    [session?.user?.id],
  )

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      return
    }

    setProfileLoading(true)

    const claimsValid = await validateSessionClaims()
    if (!claimsValid) {
      setProfile(null)
      setProfileError('Session invalide ou expirée.')
      setProfileLoading(false)
      return
    }

    await loadProfile(userId)
    setProfileLoading(false)
  }, [loadProfile, session?.user?.id])

  const loading = !authReady || profileLoading

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [
      session,
      profile,
      profileError,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
