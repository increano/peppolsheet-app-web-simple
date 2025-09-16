import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug staging table API called')
    
    // Check if table exists by trying to query it
    const { data: tableCheck, error: tableError } = await supabase
      .from('business_entities_staging')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('❌ Table check error:', tableError)
      return NextResponse.json({
        error: 'Table does not exist or access denied',
        details: tableError.message,
        code: tableError.code
      }, { status: 500 })
    }

    // Get all staging entities
    const { data: entities, error: fetchError } = await supabase
      .from('business_entities_staging')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch staging entities',
        details: fetchError.message
      }, { status: 500 })
    }

    console.log(`✅ Found ${entities?.length || 0} staging entities`)

    return NextResponse.json({
      success: true,
      tableExists: true,
      entityCount: entities?.length || 0,
      entities: entities || []
    })

  } catch (error) {
    console.error('Debug staging error:', error)
    return NextResponse.json({
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
