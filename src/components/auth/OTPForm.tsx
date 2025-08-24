import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../ui/input-otp'
import { Loader2, ArrowLeft } from 'lucide-react'
import { verifyOTP } from '../../lib/supabase'
import { toast } from 'sonner'

interface OTPFormProps {
  email: string
  onBack: () => void
}

export function OTPForm({ email, onBack }: OTPFormProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      await verifyOTP(email, otp)
      toast.success('Successfully signed in!')
      // User will be redirected automatically by auth state change
    } catch (error: any) {
      console.error('OTP verification error:', error)
      toast.error(error.message || 'Invalid verification code')
      setOtp('') // Clear the OTP input on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xl">CC</span>
        </div>
        <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to <br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email
        </Button>
      </CardContent>
    </Card>
  )
}
