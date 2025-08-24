import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserProfile, signUpWithPassword, signInWithPassword } from '../lib/supabase'

interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  bio?: string
  avatar_url?: string
  campus?: string
  year?: string
  interests?: string[]
  profile_complete: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  signUp: async () => {},
  signIn: async () => {},
  refreshProfile: async () => {}
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const loadProfile = async (currentUser: User) => {
    try {
      setProfileLoading(true)
      const userProfile = await getUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user)
    }
  }

  useEffect(() => {
    // Load user on mount
    async function loadUser() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          await loadProfile(user)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // NEVER use any async operations in callback
        const currentUser = session?.user || null
        setUser(currentUser)
        setLoading(false)
        
        // Load profile for authenticated users (outside of callback)
        if (currentUser) {
          setTimeout(() => loadProfile(currentUser), 0)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    return await signUpWithPassword(email, password)
  }

  const signIn = async (email: string, password: string) => {
    return await signInWithPassword(email, password)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      profileLoading, 
      signUp, 
      signIn, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
