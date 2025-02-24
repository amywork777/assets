import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stlCache } from '../checkout/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify the payment was successful
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Get the STL ID from the session metadata
    const stlId = session.metadata?.stlId
    if (!stlId) {
      return NextResponse.json({ error: 'STL data not found' }, { status: 404 })
    }

    // Get the STL data from our cache
    const stlData = stlCache.get(stlId)
    if (!stlData) {
      return NextResponse.json({ error: 'STL data expired' }, { status: 404 })
    }

    // Return the STL file
    const headers = new Headers()
    headers.set('Content-Type', 'application/sla')
    headers.set('Content-Disposition', `attachment; filename="${session.metadata?.productName || 'model'}.stl"`)

    return new NextResponse(stlData, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error in download-stl route:', error)
    return NextResponse.json(
      { error: 'Error downloading STL file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 