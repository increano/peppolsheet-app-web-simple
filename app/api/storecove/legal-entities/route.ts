import { NextRequest, NextResponse } from 'next/server'
import { createStorecoveClient } from '@/lib/storecove/config'
import { CreateLegalEntityRequest } from '@/lib/storecove/types'

export async function GET() {
  try {
    const client = createStorecoveClient()
    const legalEntities = await client.getLegalEntities()
    
    return NextResponse.json(legalEntities)
  } catch (error) {
    console.error('Error fetching legal entities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch legal entities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLegalEntityRequest = await request.json()
    
    if (!body.name || !body.country) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      )
    }

    const client = createStorecoveClient()
    const legalEntity = await client.createLegalEntity(body)
    
    return NextResponse.json(legalEntity, { status: 201 })
  } catch (error) {
    console.error('Error creating legal entity:', error)
    return NextResponse.json(
      { error: 'Failed to create legal entity' },
      { status: 500 }
    )
  }
}
