import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://egdavxjkyxvawgguqmvx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4'

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

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
    }
  })

  if (error) {
    console.error('Error signing in with Google:', error.message)
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}
