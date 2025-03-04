import { NextResponse } from 'next/server'
import { stlCache } from '../checkout/route'

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const sessionId = searchParams.get('session_id')
    const stlId = searchParams.get('stl_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    if (!stlId) {
      return NextResponse.json({ error: 'STL ID is required' }, { status: 400 })
    }

    // Get the STL data from our cache
    const stlData = stlCache.get(stlId)
    if (!stlData) {
      return NextResponse.json({ error: 'STL data expired or not found' }, { status: 404 })
    }

    // Return the STL file
    const headers = new Headers()
    headers.set('Content-Type', 'application/sla')
    headers.set('Content-Disposition', `attachment; filename="model.stl"`)

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