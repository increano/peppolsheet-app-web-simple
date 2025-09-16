import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['en', 'fr']
const defaultLocale = 'en'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

// Role detection function for middleware
function detectUserRole(userEmail: string): string | null {
  if (!userEmail) return null

  const adminEmail = process.env.ADMIN_USER_EMAIL
  const supportEmails = process.env.SUPPORT_USER_EMAILS?.split(',').map(email => email.trim()) || []

  if (userEmail === adminEmail) return 'admin'
  if (supportEmails.includes(userEmail)) return 'support'

  return null
}

// Role-based route protection mapping
const roleProtectedPaths = {
  '/dashboard/admin': ['admin'],
  '/dashboard/support': ['admin', 'support']
}

export async function middleware(req: NextRequest) {
  console.log('🚦 Middleware - Processing request:', req.nextUrl.pathname)
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle internationalization first for all requests
  const intlResponse = intlMiddleware(req)
  
  // If intl middleware returns a redirect, return it immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    console.log('🚦 Middleware - Intl middleware redirecting')
    return intlResponse
  }

  // Extract locale from pathname after intl processing
  const pathname = req.nextUrl.pathname
  const locale = pathname.split('/')[1]
  
  // If no valid locale, let intl middleware handle it
  if (!locale || !locales.includes(locale)) {
    console.log('🚦 Middleware - No valid locale, using intl middleware')
    return intlResponse
  }

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/invoices',
    '/customers',
    '/settings',
    '/analytics'
  ]

  // Define public routes that should always be accessible
  const publicPaths = [
    '/login$', // Only the main login page, not subdirectories
    '/signup',
    '/login/recovery',
    '/account-recovery'
  ]

  // Define routes that need special token validation
  const tokenValidatedPaths = [
    '/login/validate'
  ]

  // Define routes that require authentication but aren't fully protected (like onboarding)
  const authRequiredPaths = [
    '/login/onboarding',
    '/onboarding'
  ]

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.includes(path)
  )

  // Check if current path is explicitly public
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('$')) {
      // Exact match for paths ending with $
      const cleanPath = path.slice(0, -1)
      return pathname === `/${locale}${cleanPath}` || pathname === cleanPath
    }
    return pathname.includes(path)
  })

  // Check if current path requires authentication
  const isAuthRequiredPath = authRequiredPaths.some(path => 
    pathname.includes(path)
  )

  // Check if current path requires token validation
  const isTokenValidatedPath = tokenValidatedPaths.some(path => 
    pathname.includes(path)
  )

  // Check if current path requires role-based access
  const isRoleProtectedPath = Object.keys(roleProtectedPaths).some(rolePath => 
    pathname.includes(rolePath)
  )

  console.log('🚦 Middleware - Path analysis:', {
    pathname,
    locale,
    isProtectedPath,
    isPublicPath,
    isAuthRequiredPath,
    isTokenValidatedPath,
    isRoleProtectedPath
  })

  // If it's explicitly a public path, continue with intl response
  if (isPublicPath) {
    console.log('🚦 Middleware - Explicitly public path, continuing')
    return intlResponse
  }

  // If it's a token-validated path, check for proper parameters
  if (isTokenValidatedPath) {
    const url = new URL(req.url)
    const hasEmail = url.searchParams.has('email')
    const hasFirstName = url.searchParams.has('firstName')
    const referer = req.headers.get('referer') || ''
    const comesFromCallback = referer.includes('/auth/callback') || 
                              url.searchParams.has('from_callback') ||
                              req.headers.get('x-supabase-auth') === 'true'
    
    console.log('🚦 Middleware - Token validation check:', {
      hasEmail,
      hasFirstName,
      comesFromCallback,
      referer,
      searchParams: Object.fromEntries(url.searchParams.entries())
    })

    // Allow access if it comes from auth callback or has proper parameters
    if (comesFromCallback || (hasEmail && hasFirstName)) {
      console.log('🚦 Middleware - Token validated path allowed')
      return intlResponse
    } else {
      console.log('🚦 Middleware - Token validation failed, redirecting to login')
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
    }
  }

  // If it's an auth-required path or protected path, check authentication
  if (isAuthRequiredPath || isProtectedPath || isRoleProtectedPath) {
    console.log('🚦 Middleware - Auth required, checking session')
    // Continue to authentication check below
  } else {
    // If not a protected or auth-required path, continue with intl response
    console.log('🚦 Middleware - Public path, continuing')
    return intlResponse
  }

  // For protected paths, check authentication using Supabase SSR
  try {
    let response = intlResponse
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Set cookies in the response
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            // Remove cookies from the response
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.log('🚦 Middleware - Session error:', error.message)
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
    }

    if (!session) {
      console.log('🚦 Middleware - No session, redirecting to login')
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
    }

    console.log('🚦 Middleware - User authenticated, allowing access')
    
    // If it's a role-protected path, check role access
    if (isRoleProtectedPath) {
      const userEmail = session.user.email!
      const userRole = detectUserRole(userEmail)
      
      console.log('🚦 Middleware - Role check:', {
        userEmail,
        userRole,
        pathname
      })
      
      // Find the matching role path and required roles
      const matchingRolePath = Object.keys(roleProtectedPaths).find(rolePath => 
        pathname.includes(rolePath)
      )
      
      if (matchingRolePath) {
        const requiredRoles = roleProtectedPaths[matchingRolePath as keyof typeof roleProtectedPaths]
        
        if (!userRole || !requiredRoles.includes(userRole)) {
          console.log('🚦 Middleware - Insufficient role, redirecting to e-invoice overview:', {
            userRole,
            requiredRoles,
            pathname
          })
          return NextResponse.redirect(new URL(`/${locale}/dashboard/e-invoice/overview`, req.url))
        }
        
        console.log('🚦 Middleware - Role access granted:', {
          userRole,
          requiredRoles,
          pathname
        })
      }
    }
    
    // User is authenticated and has appropriate role (if required), allow access
    // All tenant management happens at component level
    return response

  } catch (error) {
    console.error('🚦 Middleware - Auth check error:', error)
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|.*\\..*|favicon.ico).*)',
    // Optional: only run on root (/) URL
    // '/'
  ]
}