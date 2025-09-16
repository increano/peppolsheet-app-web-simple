import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stagingService } from '@/lib/staging-service'
import { detectUserRole } from '@/lib/role-detection'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Check if user is admin
    const userRole = detectUserRole(user.email || '')
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Get request body
    const { stagingId, notes } = await request.json()
    
    if (!stagingId) {
      return NextResponse.json({ error: 'Staging ID is required' }, { status: 400 })
    }
    
    // Approve the staging entity
    const result = await stagingService.approveEntity(stagingId, user.id, notes)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        businessEntityId: result.businessEntityId,
        customerId: result.customerId,
        supplierId: result.supplierId
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Error approving staging entity:', error)
    return NextResponse.json(
      { error: 'Failed to approve staging entity' },
      { status: 500 }
    )
  }
}
