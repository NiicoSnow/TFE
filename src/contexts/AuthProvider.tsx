import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/profile'
import { AuthContext, type AuthContextValue } from './auth-context'

async function validateSessionClaims() {
  const { data, error } = await supabase.auth.getClaims()
  return !error && Boolean(data?.claims?.sub)
}

async function loadProfileForUser(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { profile: null as Profile | null, error: error.message }
  }
  if (!data) {
    return { profile: null, error: 'Profil introuvable.' }
  }
  return { profile: data as Profile, error: null }
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
        setProfile(null)
        setProfileError(null)
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

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)
    setProfileError(null)

    void (async () => {
      const claimsValid = await validateSessionClaims()
      if (!active) return

      if (!claimsValid) {
        setProfile(null)
        setProfileError('Session invalide ou expirée.')
        setProfileLoading(false)
        return
      }

      const { profile: nextProfile, error } = await loadProfileForUser(userId)
      if (!active) return

      if (error) {
        setProfile(null)
        setProfileError(error)
      } else {
        setProfile(nextProfile)
      }

      setProfileLoading(false)
    })()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  async function signUp({
    email,
    password,
    username,
    displayName,
  }: {
    email: string
    password: string
    username: string
    displayName: string
  }) {
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
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  async function updateProfile(updates: {
    username?: string
    display_name?: string
    avatar_url?: string
    library_public?: boolean
  }) {
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
  }

  async function refreshProfile() {
    const userId = session?.user?.id
    if (!userId) {
      return
    }

    setProfileLoading(true)
    setProfileError(null)

    const claimsValid = await validateSessionClaims()
    if (!claimsValid) {
      setProfile(null)
      setProfileError('Session invalide ou expirée.')
      setProfileLoading(false)
      return
    }

    const { profile: nextProfile, error } = await loadProfileForUser(userId)

    if (error) {
      setProfile(null)
      setProfileError(error)
    } else {
      setProfile(nextProfile)
    }

    setProfileLoading(false)
  }

  const loading = !authReady || profileLoading

  const value: AuthContextValue = {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
