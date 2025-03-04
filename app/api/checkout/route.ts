import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Simple in-memory cache for STL data (in production, use Redis or similar)
const stlCache = new Map<string, string>()

export async function POST(req: Request) {
  try {
    const { priceId, stlData, productName } = await req.json()
    
    console.log('Creating dummy checkout session for:', { productName })
    
    // Generate a unique ID for the STL data
    let stlId: string | undefined
    if (stlData) {
      stlId = crypto.randomBytes(16).toString('hex')
      stlCache.set(stlId, stlData)
      // Clear the cache after 1 hour
      setTimeout(() => stlCache.delete(stlId), 3600000)
    }

    // Create a dummy session ID
    const sessionId = crypto.randomBytes(16).toString('hex')

    console.log('Dummy checkout session created:', sessionId)
    // Return a dummy success URL
    return NextResponse.json({ 
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id=${sessionId}`,
      sessionId: sessionId,
      stlId: stlId
    })
  } catch (error) {
    console.error('Error in checkout route:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Export the STL cache for use in download route
export { stlCache }

// Handle GET requests for regular product purchases
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const priceId = searchParams.get('priceId')

    // Create a dummy session ID
    const sessionId = crypto.randomBytes(16).toString('hex')

    // Return a dummy success URL
    return NextResponse.json({ 
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id=${sessionId}` 
    })
  } catch (error) {
    console.error('Error in checkout route:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 