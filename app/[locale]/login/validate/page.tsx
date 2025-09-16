"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams, useParams } from 'next/navigation'
import { PublicRoute } from '@/components/auth/protected-route'
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Building, Shield, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageSelector } from "@/components/ui/language-selector"
import Link from 'next/link'
import { supabase } from '@/lib/auth-context'

export default function ValidateEmailPage() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string || 'en'
  
  const email = searchParams.get('email') || 'your email address'
  const firstName = searchParams.get('firstName') || ''
  const fromCallback = searchParams.get('from_callback') === 'true'
  
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [showEmailHelp, setShowEmailHelp] = useState(false)
  
  const handleResendEmail = async () => {
    console.log('🔄 Resending email for:', email)
    
    if (email === 'your email address') {
      setResendError('Cannot resend email - no email address provided')
      return
    }
    
    setIsResending(true)
    setResendMessage(null)
    setResendError(null)
    
    const redirectUrl = `${window.location.origin}/auth/callback`
    console.log('🔄 Redirect URL:', redirectUrl)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })
      
      if (error) {
        throw error
      }
      
      setResendMessage('Confirmation email sent! Please check your inbox.')
    } catch (error) {
      console.error('Resend email error:', error)
      setResendError(error instanceof Error ? error.message : 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <PublicRoute>
      <div className="h-screen flex">
        {/* Left Column - Cover Image */}
        <div className="hidden md:flex md:w-3/5 lg:w-2/4 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100" 
            style={{backgroundImage: 'url(/images/login-cover.png)'}} 
          />
          
          {/* Black gradient overlay - black at top-left corner with smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/60 via-25% via-black/30 via-40% to-transparent" />
          
          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-between px-12 text-white py-12">
            <div className="space-y-4">
              {/* Logo placeholder */}
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold">PeppolSheet</h1>
              </div>
              
              {/* Main heading */}
              <div className="">
                <p className="text-xl opacity-90 leading-relaxed">
                  Built for those who rely on simplicity.
                </p>
              </div>
              
            </div>
            
            {/* Testimonial at bottom */}
            <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-lg italic mb-3">
                "PeppolSheet reduced our invoice processing time by 80% and eliminated manual errors completely."
              </p>
              <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm opacity-75">CFO, TechCorp Europe</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Validation Content */}
        <div className="w-full md:w-2/5 lg:w-2/4 flex flex-col justify-center bg-white px-8 py-8">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Mobile header (visible only on small screens) */}
            <div className="md:hidden text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">PeppolSheet</h1>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="flex justify-center">
              <LanguageSelector />
            </div>

            {/* Validation Content - Direct in container */}
            <div className="w-full">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Account Created Successfully!
                </h1>
                <p className="text-gray-600">
                  Please check your email to complete registration
                </p>
              </div>

                              {/* Fixed height container to match login */}
              <div className="min-h-[600px] flex flex-col">
                <div className="space-y-4 flex-1">
                {/* Success Message */}
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <div className="text-sm">
                        We&apos;ve sent a confirmation link to <strong>{email}</strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Resend Messages */}
                {resendMessage && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {resendMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {resendError && (
                  <Alert variant="destructive">
                    <AlertDescription>{resendError}</AlertDescription>
                  </Alert>
                )}

                {/* Instructions */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">What&apos;s next?</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>1. Check your email inbox for our confirmation message</p>
                      <p>2. Click the confirmation link in the email</p>
                      <p>3. You&apos;ll be redirected back to complete your setup</p>
                      <p>4. Start managing your cashflow!</p>
                    </div>
                  </div>
                  {/*
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-800">
                          Important: Email confirmation is required
                        </div>
                        <div className="text-yellow-700 mt-1">
                          You must click the confirmation link in the email before you can log in to your account.
                        </div>
                      </div>
                    </div>
                  </div>*/}
                </div>

                                {/* Actions - Separate section with proper spacing */}
<div className="space-y-4 mt-6">
                  {fromCallback ? (
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = `/${locale}/login/onboarding`}
                    >
                      Continue to Setup
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="w-full"
                    >
                      {isResending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      {isResending ? 'Sending...' : 'Resend Confirmation Email'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = `/${locale}/login`}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      onClick={() => setShowEmailHelp(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Need help?
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-8">
              <p>© {new Date().getFullYear()} PeppolSheet. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Email Help Popup */}
        {showEmailHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              {/* Close button */}
              <button
                onClick={() => setShowEmailHelp(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Popup content */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">

                  <h3 className="text-lg font-semibold">Can't find the email?</h3>
                </div>
                
                <div className="text-sm text-gray-700 space-y-2">
                  <p>• Check your spam/junk folder</p>
                  <p>• Wait a few minutes for delivery (up to 5 minutes)</p>
                  <p>• Make sure you entered the correct email address</p>
                  <p>• The email will come from our system</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-800">
                        Still having trouble?
                      </div>
                      <div className="text-yellow-700">
                        You can resend the confirmation email using the button above.
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 space-y-2 text-center">Or contact us : support@peppolsheet.com</p>
                <Button
                  onClick={() => setShowEmailHelp(false)}
                  className="w-full"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicRoute>
  )
}
