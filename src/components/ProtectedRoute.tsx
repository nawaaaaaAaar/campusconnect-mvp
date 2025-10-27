import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireProfile = true, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">CC</span>
            </div>
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">
              Checking your authentication status...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    // Redirect to auth page but save the attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Check if profile is required and not complete
  if (requireProfile && profile) {
    // 🔧 ENHANCED: More flexible profile completeness check
    const isProfileComplete = (() => {
      // Basic requirements for all account types
      if (!profile.name || profile.name.trim().length < 2) return false
      if (!profile.account_type) return false
      
      // For societies, be more lenient about required fields
      if (profile.account_type === 'society') {
        // Society accounts: name + account type is enough to consider "complete enough"
        // Full society details can be added later
        return profile.name && profile.name !== profile.email
      }
      
      // For students, require institute as well
      if (profile.account_type === 'student') {
        return profile.name && profile.institute && profile.institute.trim().length > 0
      }
      
      return false
    })()
    
    if (!isProfileComplete && location.pathname !== '/profile-setup') {
      console.log('Profile not complete, redirecting to setup')
      return <Navigate to="/profile-setup" replace />
    }
  } else if (requireProfile && !profile) {
    // If profile is required but doesn't exist, redirect to profile setup
    if (location.pathname !== '/profile-setup') {
      console.log('No profile found, redirecting to setup')
      return <Navigate to="/profile-setup" replace />
    }
  }

  // Check if admin access is required
  if (requireAdmin && profile && !profile.is_admin) {
    // User is not an admin, redirect to dashboard with error message
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
