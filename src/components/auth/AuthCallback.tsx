import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
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
              // If profile doesn't exist or error, go to profile setup
              navigate('/profile-setup')
            }
            return
          }
        }

        // Handle OAuth session (existing logic)
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          toast.error('Failed to establish session')
          navigate('/auth')
          return
        }

        if (data.session && data.session.user) {
          console.log('User authenticated via OAuth:', data.session.user.email)
          toast.success(`Welcome back, ${data.session.user.email}!`)
          
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
            // If profile doesn't exist or error, go to profile setup
            navigate('/profile-setup')
          }
        } else {
          // If no session, redirect to auth
          navigate('/auth')
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

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
