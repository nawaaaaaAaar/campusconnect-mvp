import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { OTPForm } from '../components/auth/OTPForm'

type AuthStep = 'login' | 'signup' | 'otp'

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')

  const handleSwitchToOTP = (userEmail: string) => {
    setEmail(userEmail)
    setCurrentStep('otp')
  }

  const handleSwitchToSignup = () => {
    setCurrentStep('signup')
  }

  const handleBackToLogin = () => {
    setCurrentStep('login')
    setEmail('')
  }

  const handleSignupSuccess = () => {
    // After successful signup, redirect to login or show confirmation
    setCurrentStep('login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {currentStep === 'login' && (
        <LoginForm 
          onSwitchToOTP={handleSwitchToOTP} 
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      {currentStep === 'signup' && (
        <SignupForm 
          onBack={handleBackToLogin}
          onSuccess={handleSignupSuccess}
        />
      )}
      {currentStep === 'otp' && (
        <OTPForm email={email} onBack={handleBackToLogin} />
      )}
    </div>
  )
}
