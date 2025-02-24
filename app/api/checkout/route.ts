import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})

// Simple in-memory cache for STL data (in production, use Redis or similar)
const stlCache = new Map<string, string>()

export async function POST(req: Request) {
  try {
    const { priceId, stlData, productName } = await req.json()
    
    console.log('Creating checkout session with:', { priceId, productName })
    
    // Validate required fields
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Generate a unique ID for the STL data
    let stlId: string | undefined
    if (stlData) {
      stlId = crypto.randomBytes(16).toString('hex')
      stlCache.set(stlId, stlData)
      // Clear the cache after 1 hour
      setTimeout(() => stlCache.delete(stlId), 3600000)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(stlData ? {} : { shipping_address_collection: { allowed_countries: ['US'] } }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      metadata: {
        productName: productName || 'Unknown Product',
        stlId: stlId || '',
      },
    })

    console.log('Checkout session created:', session.id)
    return NextResponse.json({ url: session.url })
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

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error in checkout route:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 