import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminPanel } from '../components/AdminPanel'
import { useAuth } from '../contexts/AuthContext'
import { campusAPI } from '../lib/api'
import { Loader2 } from 'lucide-react'

export function AdminPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Call admin API to verify user is admin
        const response = await campusAPI.getAdminAnalytics()
        
        // If we get a response without error, user is admin
        setIsAdmin(true)
      } catch (error: any) {
        // If we get 403 or 401, user is not admin
        if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
          setIsAdmin(false)
        } else {
          // Other errors, assume not admin for safety
          setIsAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkAdminStatus()
    } else {
      setLoading(false)
      setIsAdmin(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="mb-4">
            <svg
              className="h-16 w-16 text-red-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin panel.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you believe you should have admin access, please contact the system administrator.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPanel />
    </div>
  )
}



