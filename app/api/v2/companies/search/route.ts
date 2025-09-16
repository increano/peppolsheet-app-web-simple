import { NextRequest, NextResponse } from 'next/server'
import { CompanySearchV2Response } from '@/shared/types/company-search-v2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const country = searchParams.get('country') || 'BE'
    const limit = searchParams.get('limit') || '20'
    const page = searchParams.get('page') || '1'
    
    if (!q) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 })
    }

    // Use the environment variable for PeppolSheet API endpoint
    const apiUrl = process.env.BUSINESS_DIRECTORY_API_URL || 'https://api.peppolsheet.com/api/v2'
    const clientId = process.env.BUSINESS_DIRECTORY_CLIENT_ID
    const clientSecret = process.env.BUSINESS_DIRECTORY_CLIENT_SECRET

    console.log('🔍 V2 Company search environment check:', {
      clientId: clientId ? `${clientId.substring(0, 4)}...` : 'NOT SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 4)}...` : 'NOT SET'
    })

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'API credentials not configured' }, { status: 500 })
    }

    // Parse country parameter - focus on Belgian companies
    const primaryCountry = country.toUpperCase() === 'BE' ? 'BE' : 'BE'

    // Build the API URL according to documentation
    const params = new URLSearchParams({
      q,
      country: primaryCountry,
      limit,
      page
    })

    const fullUrl = `${apiUrl}/companies/search?${params.toString()}`

    // Create Bearer token: CLIENT_ID:CLIENT_SECRET (as per documentation)
    const bearerToken = `${clientId}:${clientSecret}`

    console.log(`🔍 V2 Company search calling: ${fullUrl}`)
    console.log(`🔑 Using Bearer token format: CLIENT_ID:CLIENT_SECRET`)
    console.log(`🌐 API Base URL: ${apiUrl}`)

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ V2 API Error ${response.status}:`, errorText)
        
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Authentication failed. Please check your API credentials.' },
            { status: 401 }
          )
        } else if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60'
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded. Please wait before searching again.',
              retryAfter: parseInt(retryAfter)
            },
            { status: 429 }
          )
        } else if (response.status === 400) {
          return NextResponse.json(
            { error: 'Invalid search parameters. Please check your search term.' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: `Search service temporarily unavailable. Please try again later.` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log(`✅ V2 Search successful, found ${data.companies?.length || 0} companies`)
      console.log('🔍 Raw external V2 API response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...')
      
      // Validate that the response matches v2 format
      if (!data.companies || !Array.isArray(data.companies)) {
        console.error('❌ Invalid V2 API response format - missing companies array')
        return NextResponse.json(
          { error: 'Invalid response format from external API' },
          { status: 500 }
        )
      }

      // Return the external v2 API response directly - no transformation needed
      return NextResponse.json(data)

    } catch (error) {
      console.error('❌ V2 Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to connect to company search API' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('V2 Company search API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Support POST method as well
  return GET(request)
}
