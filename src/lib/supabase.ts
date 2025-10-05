import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

export async function signInWithEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
    }
  })

  if (error) {
    console.error('Error sending OTP:', error.message)
    throw error
  }

  return data
}

export async function verifyOTP(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email'
  })

  if (error) {
    console.error('Error verifying OTP:', error.message)
    throw error
  }

  return data
}

export async function signInWithGoogle(accountType?: 'student' | 'society') {
  const redirectTo = `${window.location.protocol}//${window.location.host}/auth/callback`

  if (accountType) {
    sessionStorage.setItem('selectedAccountType', accountType)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'openid email profile'
    }
  })

  if (error) {
    console.error('Error signing in with Google:', error.message)
    throw error
  }

  return data
}

export async function signUpWithPassword(email: string, password: string, accountType?: 'student' | 'society') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
      data: {
        account_type: accountType || 'student'
      }
    }
  })

  if (error) {
    console.error('Error signing up:', error.message)
    throw error
  }

  return data
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Error signing in:', error.message)
    throw error
  }

  return data
}

// Profile management functions
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const response = await fetch(`${supabaseUrl}/functions/v1/profile-management`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to fetch profile')
  }

  const result = await response.json()
  return result.data
}

export async function createOrUpdateProfile(profileData: {
  name?: string
  bio?: string
  avatar_url?: string
  institute?: string
  course?: string
  interests?: string[]
  account_type?: 'student' | 'society'
  society_name?: string
  society_category?: string
  society_description?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const response = await fetch(`${supabaseUrl}/functions/v1/profile-management`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to save profile')
  }

  const result = await response.json()
  return result.data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}

