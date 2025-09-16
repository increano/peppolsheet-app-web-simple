"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PublicRoute } from '@/components/auth/protected-route'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, Building, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginFormData {
  email: string
  password: string
}

interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export default function TwoColumnLoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string || 'en'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  const { login, signup } = useAuth()

  const loginForm = useForm<LoginFormData>()
  const signupForm = useForm<SignupFormData>()

  // Check for URL parameters from auth callback
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error) {
      switch (error) {
        case 'confirmation_failed':
          setLoginError(`Email confirmation failed: ${message || 'Please try again'}`)
          break
        case 'callback_error':
          setLoginError(`Authentication error: ${message || 'Please try again'}`)
          break
        case 'invalid_request':
          setLoginError(`Invalid request: ${message || 'Please try again'}`)
          break
        default:
          setLoginError(`Authentication error: ${message || 'Please try again'}`)
      }
    } else if (message && message.includes('confirmed')) {
      setConfirmationMessage('Email confirmed successfully! Please log in.')
    }
  }, [searchParams])

  // Add safeguard to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Login page: clearing loading state after timeout')
        setIsLoading(false)
      }
    }, 10000)
    
    return () => clearTimeout(timeout)
  }, [isLoading])

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null)
    
    try {
      await login(data.email, data.password)
    } catch (error) {
      console.error('Login error:', error)
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true)
    setSignupError(null)
    setSignupMessage(null)

    try {
      await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: `${data.firstName} ${data.lastName}`
      })
      
      setTimeout(() => {
        router.push(`/${locale}/login/validate?email=${encodeURIComponent(data.email)}&firstName=${encodeURIComponent(data.firstName)}`)
      }, 1000)
      
    } catch (error) {
      console.error('Signup error:', error)
      
      if (error instanceof Error && (
        error.message.includes('check your email') || 
        error.message.includes('confirmation link') ||
        error.message === 'CONFIRMATION_REQUIRED'
      )) {
        setTimeout(() => {
          router.push(`/${locale}/login/validate?email=${encodeURIComponent(data.email)}&firstName=${encodeURIComponent(data.firstName)}`)
        }, 1000)
      } else {
        setSignupError(error instanceof Error ? error.message : 'Signup failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
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
                {/*<h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Cashflow Management &
                  <span className="block text-blue-200">PEPPOL-Compliant Solutinon</span>
                </h2>*/}
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
        
        {/* Right Column - Form */}
        <div className="w-full md:w-2/5 lg:w-2/4 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-6">
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

            {/* Auth Form - Direct in container */}
            <div className="w-full">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('welcomeBack')}
                </h1>
                <p className="text-gray-600">
                  {t('loginSubtitle')}
                </p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('signIn')}</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('signUp')}</TabsTrigger>
                  </TabsList>

                  {/* Tabs content with fixed height */}
                  <div className="min-h-[600px]">
                    {/* Login Tab */}
                    <TabsContent value="login" className="space-y-4 m-0">
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      {confirmationMessage && (
                        <Alert variant="default" className="border-green-200 bg-green-50">
                          <AlertDescription className="text-green-800">{confirmationMessage}</AlertDescription>
                        </Alert>
                      )}
                      
                      {loginError && (
                        <Alert variant="destructive">
                          <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t('email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            {...loginForm.register('email', {
                              required: t('emailRequired'),
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: t('invalidEmail')
                              }
                            })}
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <Alert>
                            <AlertDescription>
                              {loginForm.formState.errors.email.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t('password')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...loginForm.register('password', {
                              required: t('passwordRequired')
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <Alert>
                            <AlertDescription>
                              {loginForm.formState.errors.password.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Button variant="link" className="px-0 font-normal text-sm">
                          {t('forgotPassword')}
                        </Button>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "..." : t('signIn')}
                      </Button>
                    </form>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t('orContinueWith')}
                        </span>
                      </div>
                    </div>
                     
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </Button>
                      <Button variant="outline">
                        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.64 12c0-.84-.07-1.64-.2-2.4H12v4.54h6.5c-.28 1.5-1.14 2.77-2.43 3.61v2.98h3.94c2.3-2.12 3.63-5.24 3.63-8.73z"/>
                          <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.94-2.98c-1.08.73-2.47 1.16-3.99 1.16-3.07 0-5.67-2.07-6.6-4.86H1.34v3.08C3.35 21.3 7.34 24 12 24z"/>
                          <path d="M5.4 14.41c-.24-.73-.38-1.5-.38-2.41s.14-1.68.38-2.41V6.51H1.34C.49 8.21 0 10.05 0 12s.49 3.79 1.34 5.49l4.06-3.08z"/>
                          <path d="M12 4.75c1.73 0 3.28.59 4.5 1.76l3.36-3.36C17.95 1.19 15.24 0 12 0 7.34 0 3.35 2.7 1.34 6.51l4.06 3.08C6.33 6.82 8.93 4.75 12 4.75z"/>
                        </svg>
                        Microsoft
                      </Button>
                    </div>
                  </TabsContent>

                    {/* Signup Tab */}
                    <TabsContent value="signup" className="space-y-4 m-0">
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                      {signupError && (
                        <Alert variant="destructive">
                          <AlertDescription>{signupError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {signupMessage && (
                        <Alert variant="default">
                          <AlertDescription>
                            {signupMessage}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{t('firstName')}</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              className="pl-10"
                              {...signupForm.register('firstName', {
                                required: t('firstNameRequired')
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{t('lastName')}</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              className="pl-10"
                              {...signupForm.register('lastName', {
                                required: t('lastNameRequired')
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t('email')}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            className="pl-10"
                            {...signupForm.register('email', {
                              required: t('emailRequired'),
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: t('invalidEmail')
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t('password')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...signupForm.register('password', {
                              required: t('passwordRequired'),
                              minLength: {
                                value: 8,
                                message: t('passwordMinLength')
                              }
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...signupForm.register('confirmPassword', {
                              required: t('passwordRequired'),
                              validate: (value) => {
                                const password = signupForm.getValues('password')
                                return value === password || t('passwordMismatch')
                              }
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="terms"
                          type="checkbox"
                          className="rounded border-gray-300"
                          {...signupForm.register('agreeToTerms', {
                            required: true
                          })}
                        />
                        <Label htmlFor="terms" className="text-sm">
                          {t('termsAndConditions')}
                        </Label>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "..." : t('createAccount')}
                      </Button>
                    </form>
                    </TabsContent>
                  </div>
                </Tabs>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} PeppolSheet. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}
