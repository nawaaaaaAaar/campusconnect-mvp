import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { OTPForm } from '../components/auth/OTPForm'

type AuthStep = 'login' | 'otp'

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')

  const handleSwitchToOTP = (userEmail: string) => {
    setEmail(userEmail)
    setCurrentStep('otp')
  }

  const handleBackToLogin = () => {
    setCurrentStep('login')
    setEmail('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {currentStep === 'login' ? (
        <LoginForm onSwitchToOTP={handleSwitchToOTP} />
      ) : (
        <OTPForm email={email} onBack={handleBackToLogin} />
      )}
    </div>
  )
}
