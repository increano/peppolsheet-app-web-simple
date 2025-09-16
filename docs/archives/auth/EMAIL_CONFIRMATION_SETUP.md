# Email Confirmation Setup

This document describes the complete email confirmation implementation for the Cashflow SaaS web client.

## Overview

The email confirmation system uses Supabase Auth to handle user registration with email verification. Users must confirm their email address before they can log in and access the application.

## Architecture

### Flow Overview
1. User signs up with email and password
2. Supabase sends confirmation email with unique token
3. User clicks confirmation link in email
4. User is redirected to `/auth/callback` with confirmation token
5. System validates token and completes email confirmation
6. User is redirected to appropriate page (onboarding or dashboard)

### File Structure
```
app/
├── auth/
│   └── callback/
│       └── route.ts              # Email confirmation callback handler
├── [locale]/
│   ├── login/
│   │   └── page.tsx             # Login page with confirmation status
│   └── signup/
│       └── validate/
│           └── page.tsx         # Email validation instructions
├── middleware.ts                # Route protection with auth callback
└── lib/
    └── auth-context.tsx         # Auth context with email redirect
```

## Implementation Details

### 1. Email Confirmation Callback (`/app/auth/callback/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createClient(/* ... */)
    
    try {
      // Exchange code for session
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=confirmation_failed&message=${error.message}`)
      }
      
      // Check if user needs onboarding
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()
      
      if (tenantUser) {
        return NextResponse.redirect(`${origin}/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    } catch (error) {
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }
  
  return NextResponse.redirect(`${origin}/login?error=invalid_request`)
}
```

### 2. Auth Context Configuration (`/lib/auth-context.tsx`)

```typescript
const signUpWithPassword = async (email: string, password: string, userData?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: userData,
      emailRedirectTo: `${window.location.origin}/auth/callback`
    },
  })
  if (error) throw error
  return data
}
```

### 3. Middleware Updates (`/middleware.ts`)

```typescript
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/validate',
  '/auth/callback' // Allow email confirmation callback
]
```

### 4. Login Page Enhancements (`/app/[locale]/login/page.tsx`)

```typescript
// Handle URL parameters from auth callback
useEffect(() => {
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  
  if (error) {
    switch (error) {
      case 'confirmation_failed':
        setLoginError(`Email confirmation failed: ${message}`)
        break
      case 'callback_error':
        setLoginError(`Authentication error: ${message}`)
        break
      // ... other error cases
    }
  } else if (message && message.includes('confirmed')) {
    setConfirmationMessage('Email confirmed successfully! Please log in.')
  }
}, [searchParams])
```

### 5. Validation Page Features (`/app/[locale]/signup/validate/page.tsx`)

```typescript
const handleResendEmail = async () => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    setResendMessage('Confirmation email sent! Please check your inbox.')
  } catch (error) {
    setResendError(error.message)
  }
}
```

## Supabase Configuration

### Required Settings

1. **Email Templates**: Configure email templates in Supabase Dashboard
   - Go to Authentication > Email Templates
   - Customize the "Confirm signup" template
   - Set the redirect URL to: `{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}`

2. **Site URL**: Set in Supabase project settings
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. **Redirect URLs**: Add to allowed redirect URLs
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### Environment Variables

```env
# Required for email confirmation
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL for email redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## User Experience

### Registration Flow

1. **Signup Form**: User enters email, password, and basic info
2. **Email Sent**: System sends confirmation email to user
3. **Validation Page**: User sees instructions and can resend email
4. **Email Confirmation**: User clicks link in email
5. **Redirect**: User is redirected back to application
6. **Success**: User can now log in and access the application

### Error Handling

- **Confirmation Failed**: User is redirected to login with error message
- **Invalid Token**: User is redirected to login with error message
- **Expired Token**: User can resend confirmation email
- **Network Errors**: User sees appropriate error messages

### Resend Email Feature

- **Resend Button**: Available on validation page
- **Rate Limiting**: Supabase handles rate limiting automatically
- **Status Feedback**: Clear success/error messages
- **Loading States**: Visual feedback during resend process

## Security Considerations

### Token Security
- Confirmation tokens are single-use
- Tokens expire after 24 hours
- Tokens are securely generated by Supabase

### Rate Limiting
- Supabase enforces rate limits on email sending
- Frontend provides appropriate feedback
- Users can resend after cooldown period

### CSRF Protection
- Middleware validates all requests
- Tokens are validated server-side
- No client-side token handling

## Testing

### Manual Testing

1. **Registration Test**:
   ```bash
   # 1. Go to signup page
   # 2. Enter email and password
   # 3. Check email for confirmation link
   # 4. Click link and verify redirect
   # 5. Log in with confirmed account
   ```

2. **Resend Test**:
   ```bash
   # 1. Go to validation page
   # 2. Click "Resend Confirmation Email"
   # 3. Check email for new confirmation link
   # 4. Verify new link works
   ```

3. **Error Handling Test**:
   ```bash
   # 1. Try accessing /auth/callback without token
   # 2. Try accessing /auth/callback with invalid token
   # 3. Verify error messages appear on login page
   ```

### Development Testing

```bash
# Start development server
npm run dev

# Test signup flow
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Check email for confirmation link
# Click link to test callback flow
```

## Troubleshooting

### Common Issues

1. **Email Not Received**:
   - Check spam folder
   - Verify email address is correct
   - Check Supabase email settings
   - Verify SMTP configuration

2. **Confirmation Link Doesn't Work**:
   - Check redirect URL configuration
   - Verify site URL in Supabase
   - Check middleware configuration
   - Verify callback route is working

3. **Redirect Issues**:
   - Check environment variables
   - Verify middleware allows callback route
   - Check for typos in redirect URLs
   - Verify tenant checking logic

### Debug Steps

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard > Logs
   - Look for authentication errors
   - Check email sending logs

2. **Check Browser Console**:
   - Look for JavaScript errors
   - Check network requests
   - Verify auth state changes

3. **Check Server Logs**:
   - Look for callback route errors
   - Check middleware processing
   - Verify database queries

## Deployment

### Production Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` for production
- [ ] Configure Supabase redirect URLs for production
- [ ] Update email templates with production URLs
- [ ] Test email delivery in production
- [ ] Verify SSL certificates for email links
- [ ] Test complete flow in production environment

### Monitoring

- Monitor email delivery rates
- Track confirmation completion rates
- Monitor error rates in callback handler
- Set up alerts for auth failures

This email confirmation system provides a secure, user-friendly way to verify email addresses during registration while maintaining a smooth user experience. 