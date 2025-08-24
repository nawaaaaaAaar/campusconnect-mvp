import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { OTPForm } from '../components/auth/OTPForm'
import { AccountTypeSelection } from '../components/auth/AccountTypeSelection'

type AuthStep = 'login' | 'account-type' | 'signup' | 'otp'

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState<'student' | 'society' | null>(null)

  const handleSwitchToOTP = (userEmail: string) => {
    setEmail(userEmail)
    setCurrentStep('otp')
  }

  const handleSwitchToSignup = () => {
    setCurrentStep('account-type')
  }

  const handleAccountTypeSelection = (type: 'student' | 'society') => {
    setAccountType(type)
    setCurrentStep('signup')
  }

  const handleBackToLogin = () => {
    setCurrentStep('login')
    setEmail('')
    setAccountType(null)
  }

  const handleBackToAccountType = () => {
    setCurrentStep('account-type')
    setAccountType(null)
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
      {currentStep === 'account-type' && (
        <AccountTypeSelection
          onSelectType={handleAccountTypeSelection}
          onBack={handleBackToLogin}
        />
      )}
      {currentStep === 'signup' && accountType && (
        <SignupForm 
          accountType={accountType}
          onBack={handleBackToAccountType}
          onSuccess={handleSignupSuccess}
        />
      )}
      {currentStep === 'otp' && (
        <OTPForm email={email} onBack={handleBackToLogin} />
      )}
    </div>
  )
}
