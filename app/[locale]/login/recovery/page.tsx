"use client"

import { useAuth } from '@/lib/auth-context'
import { PublicRoute } from '@/components/auth/protected-route'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageSelector } from "@/components/ui/language-selector"
import { AlertTriangle, Mail, RefreshCw, Building } from 'lucide-react'

export default function TestRecoveryPage() {
  const { user, logout, refreshUserProfile, loading } = useAuth()

  const handleClearSession = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleRefreshProfile = async () => {
    try {
      await refreshUserProfile()
    } catch (error) {
      console.error('Profile refresh failed:', error)
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
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/60 via-25% via-black/30 via-40% to-transparent"></div>
          
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
        
        {/* Right Column - Recovery Content */}
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

            {/* Recovery Content */}
            <div className="min-h-[600px] flex flex-col">
              <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-red-700">
                    Account Recovery Required
                  </h1>
                  <p className="text-red-600 text-sm">
                    Your account data appears to be missing or corrupted
                  </p>
                </div>

                {/* Alert */}
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Account Data Missing</div>
                      <div className="text-sm">
                        Your user account appears to be missing or corrupted. 
                        This can happen if your account was deleted from the system 
                        or there was a data synchronization issue.
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Current Account Info */}
                {user && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-600">
                      <strong>Current Account:</strong>
                    </div>
                    <div className="text-sm font-mono text-gray-800">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      State: {user.userState}
                    </div>
                  </div>
                )}

                {/* Recovery Options */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recovery Options:</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Try refreshing your profile data</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Clear your session and log in again</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Contact support if the issue persists</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Create a new account if necessary</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleRefreshProfile} 
                      variant="outline" 
                      className="w-full"
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {loading ? 'Refreshing...' : 'Refresh Profile Data'}
                    </Button>
                    
                    <Button 
                      onClick={handleClearSession} 
                      variant="destructive" 
                      className="w-full"
                      disabled={loading}
                    >
                      Clear Session & Return to Login
                    </Button>
                    
                    <a 
                      href="mailto:support@peppolsheet.com"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </a>
                  </div>
                </div>
                
                {/* Support Note */}
                <div className="text-xs text-center text-gray-500">
                  <p>
                    If you continue to experience issues, please contact our support team 
                    with your email address and a description of the problem.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 mt-8">
                <p>© {new Date().getFullYear()} PeppolSheet. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}
