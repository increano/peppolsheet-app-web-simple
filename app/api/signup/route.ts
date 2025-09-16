import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      firstName,
      lastName,
      companyName,
      businessRegistrationNumber,
      peppolId,
      invoiceVolumePerMonth
    } = await request.json()

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract the token and create authenticated client
    const token = authHeader.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify the user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Prepare data for Edge Function
    const userData = {
      email: user.email,
      firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || firstName || 'Unknown',
      lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || lastName || 'Unknown',
      companyName,
      businessRegistrationNumber: businessRegistrationNumber || 'N/A', // Edge function requires this
      peppolId,
      invoiceVolumePerMonth
    }

    console.log('Sending to Edge Function:', userData)

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('signup', {
      body: userData
    })

    if (error) {
      console.error('Signup function error:', error)
      
      // Try to get the actual error response from the edge function
      let errorMessage = 'Failed to create organization'
      if (error.context && error.context.status) {
        try {
          const errorResponse = await error.context.text()
          console.error('Edge function error response:', errorResponse)
          const errorData = JSON.parse(errorResponse)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: error.context?.status || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
