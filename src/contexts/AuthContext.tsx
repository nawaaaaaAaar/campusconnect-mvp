import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getUserProfile, signUpWithPassword, signInWithPassword } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  name?: string
  avatar_url?: string
  institute?: string
  course?: string
  account_type: 'student' | 'society'
  created_at: string
  updated_at?: string
  is_admin?: boolean // Admin flag
  stats?: {
    societies_member_of: number
    societies_following: number
  }
  society_memberships?: any[]
  society_follows?: any[]
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signUp: (email: string, password: string, accountType?: 'student' | 'society') => Promise<any>
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
      
      // Validate session before making API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No active session found')
        setProfile(null)
        return
      }

      const userProfile = await getUserProfile()
      setProfile(userProfile)
    } catch (error: any) {
      console.error('Error loading profile:', error)
      
      // 🔧 IMPROVED: More specific error handling
      if (error.message?.includes('Invalid authentication token') || 
          error.message?.includes('No active session')) {
        console.log('Authentication expired, clearing session')
        // Clear potentially invalid session
        await supabase.auth.signOut()
        setProfile(null)
        setUser(null)
      } else if (error.message?.includes('Failed to fetch')) {
        // Network or server error - could be temporary
        console.log('Profile API unavailable, will retry on next session check')
        // Don't set profile to null on network errors - keep existing profile if available
        if (!profile) {
          setProfile(null)
        }
        // Set a flag to retry later
        setTimeout(() => {
          if (currentUser) {
            console.log('Retrying profile load...')
            loadProfile(currentUser)
          }
        }, 5000) // Retry after 5 seconds
      } else if (error.message?.includes('Profile not found')) {
        console.log('Profile not found, user may need to complete setup')
        setProfile(null)
      } else {
        // For other errors, be more careful - don't automatically assume profile setup is needed
        console.log('Profile loading error, keeping existing profile state')
        // Only set profile to null if we don't already have one
        if (!profile) {
          setProfile(null)
        }
      }
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

  const signUp = async (email: string, password: string, accountType?: 'student' | 'society') => {
    return await signUpWithPassword(email, password, accountType)
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
