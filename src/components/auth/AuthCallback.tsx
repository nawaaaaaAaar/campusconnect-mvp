import React, { useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Handle hash-based authentication (OAuth)
        if (location.hash) {
          console.log('Processing OAuth callback with hash:', location.hash)
          
          // Let Supabase handle the OAuth callback automatically
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('OAuth session error:', error)
            toast.error('OAuth authentication failed')
            navigate('/auth')
            return
          }

          if (data.session && data.session.user) {
            console.log('OAuth user authenticated:', data.session.user.email)
            toast.success(`Welcome, ${data.session.user.email || data.session.user.user_metadata?.name}!`)
            
            // Check if user needs profile setup
            try {
              const { getUserProfile } = await import('../../lib/supabase')
              const profile = await getUserProfile()
              
              if (!profile || !profile.profile_complete) {
                navigate('/profile-setup')
              } else {
                navigate('/dashboard')
              }
            } catch (profileError) {
              console.log('No profile found, redirecting to profile setup')
              navigate('/profile-setup')
            }
            return
          }
        }

        // Check for error in URL parameters
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          toast.error(errorDescription || 'Authentication failed')
          navigate('/auth')
          return
        }

        // Check if this is an email confirmation (has token_hash and type params)
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (tokenHash && type) {
          console.log('Processing email confirmation with token:', tokenHash, 'type:', type)
          
          // Handle email confirmation
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          })
          
          if (verifyError) {
            console.error('Email verification error:', verifyError)
            toast.error('Email verification failed. Please try again.')
            navigate('/auth')
            return
          }
          
          if (data.session && data.session.user) {
            console.log('Email confirmed, user authenticated:', data.session.user.email)
            toast.success(`Email confirmed! Welcome, ${data.session.user.email}!`)
            
            // Check if user needs profile setup
            try {
              const { getUserProfile } = await import('../../lib/supabase')
              const profile = await getUserProfile()
              
              if (!profile || !profile.profile_complete) {
                navigate('/profile-setup')
              } else {
                navigate('/dashboard')
              }
            } catch (profileError) {
              console.log('No profile found, redirecting to profile setup')
              navigate('/profile-setup')
            }
            return
          }
        }

        // Handle regular session check for other cases
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          toast.error('Failed to establish session')
          navigate('/auth')
          return
        }

        if (data.session && data.session.user) {
          console.log('User authenticated via session:', data.session.user.email)
          
          // Check if user needs profile setup
          try {
            const { getUserProfile } = await import('../../lib/supabase')
            const profile = await getUserProfile()
            
            if (!profile || !profile.profile_complete) {
              navigate('/profile-setup')
            } else {
              navigate('/dashboard')
            }
          } catch (profileError) {
            console.log('No profile found, redirecting to profile setup')
            navigate('/profile-setup')
          }
        } else {
          // If no session, redirect to auth
          console.log('No session found, redirecting to auth')
          navigate('/auth')
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams, location.hash])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">CC</span>
          </div>
          <CardTitle className="text-2xl font-bold">Completing Sign In</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-muted-foreground">
            Please wait while we complete your authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
