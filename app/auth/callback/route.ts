import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Email confirmation error:', error)
        return NextResponse.redirect(`${origin}/en/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`)
      }
      
      if (user) {
        // Email confirmed successfully
        console.log('Email confirmed for user:', user.email)
        
        // Check if user needs to complete onboarding
        const { data: tenantUser, error: tenantError } = await supabase
          .from('tenant_users')
          .select(`
            tenant_id,
            tenants (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        if (tenantError && tenantError.code !== 'PGRST116') {
          console.error('Error checking tenant:', tenantError)
        }
        
        if (tenantUser) {
          // User has a tenant, redirect to e-invoice overview
          console.log('Email confirmed - user has tenant, redirecting to e-invoice overview')
          return NextResponse.redirect(`${origin}/en/dashboard/overview`)
        } else {
          // User needs to complete onboarding, redirect to validate page first
          console.log('Email confirmed - new user needs validation page')
          const email = encodeURIComponent(user.email || '')
          const firstName = encodeURIComponent(user.user_metadata?.firstName || user.user_metadata?.first_name || '')
          return NextResponse.redirect(`${origin}/en/login/validate?email=${email}&firstName=${firstName}&from_callback=true`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/en/login?error=callback_error&message=${encodeURIComponent('Authentication failed')}`)
    }
  }
  
  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/en/login?error=invalid_request&message=${encodeURIComponent('No confirmation code provided')}`)
} 