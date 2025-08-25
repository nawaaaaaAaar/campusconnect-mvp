import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { OTPForm } from '../components/auth/OTPForm'
import { AccountTypeSelection } from '../components/auth/AccountTypeSelection'

type AuthStep = 'account-type' | 'login' | 'signup' | 'otp'

export function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('account-type')
  const [email, setEmail] = useState('')
  const [accountType, setAccountType] = useState<'student' | 'society' | null>(null)

  const handleSwitchToOTP = (userEmail: string) => {
    setEmail(userEmail)
    setCurrentStep('otp')
  }

  const handleSwitchToLogin = () => {
    if (!accountType) {
      setCurrentStep('account-type')
    } else {
      setCurrentStep('login')
    }
  }

  const handleSwitchToSignup = () => {
    if (!accountType) {
      setCurrentStep('account-type')
    } else {
      setCurrentStep('signup')
    }
  }

  const handleAccountTypeSelection = (type: 'student' | 'society') => {
    setAccountType(type)
    // Store account type in sessionStorage to persist through OAuth
    sessionStorage.setItem('selectedAccountType', type)
    setCurrentStep('login')
  }

  const handleBackToLogin = () => {
    setCurrentStep('login')
    setEmail('')
  }

  const handleBackToAccountType = () => {
    setCurrentStep('account-type')
    setAccountType(null)
    sessionStorage.removeItem('selectedAccountType')
  }

  const handleSignupSuccess = () => {
    // After successful signup, redirect to login or show confirmation
    setCurrentStep('login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {currentStep === 'account-type' && (
        <AccountTypeSelection
          onSelectType={handleAccountTypeSelection}
        />
      )}
      {currentStep === 'login' && accountType && (
        <LoginForm 
          accountType={accountType}
          onSwitchToOTP={handleSwitchToOTP} 
          onSwitchToSignup={handleSwitchToSignup}
          onBack={handleBackToAccountType}
        />
      )}
      {currentStep === 'signup' && accountType && (
        <SignupForm 
          accountType={accountType}
          onBack={handleSwitchToLogin}
          onSuccess={() => setCurrentStep('login')}
        />
      )}
      {currentStep === 'otp' && (
        <OTPForm email={email} onBack={handleBackToLogin} />
      )}
    </div>
  )
}
