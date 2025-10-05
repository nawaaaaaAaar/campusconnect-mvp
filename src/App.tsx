import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { AuthCallback } from './components/auth/AuthCallback'
import { ProfileSetup } from './components/auth/ProfileSetup'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error to external service
        console.error('Global error caught:', error, errorInfo)
        // TODO: Send to Sentry or other error tracking service
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Profile setup route - requires auth but not complete profile */}
              <Route 
                path="/profile-setup" 
                element={
                  <ProtectedRoute requireProfile={false}>
                    <ProfileSetup />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes - require auth and complete profile */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all - redirect to auth */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right"
              expand={false}
              richColors
              closeButton
            />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
