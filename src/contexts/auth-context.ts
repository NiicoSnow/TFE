import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types/profile'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  profileError: string | null
  loading: boolean
  signUp: (params: {
    email: string
    password: string
    username: string
    displayName: string
  }) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: {
    username?: string
    display_name?: string
    avatar_url?: string
    library_public?: boolean
  }) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
