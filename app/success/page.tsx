'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const stlId = searchParams.get('stl_id')

  useEffect(() => {
    const downloadSTL = async () => {
      try {
        // Only try to download if we have both IDs
        if (!stlId) {
          console.log('No STL ID provided, skipping download')
          return
        }
        
        const response = await fetch(`/api/download-stl?session_id=${sessionId}&stl_id=${stlId}`)
        
        if (response.ok) {
          // Get the filename from the Content-Disposition header
          const contentDisposition = response.headers.get('Content-Disposition')
          const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
          const filename = filenameMatch ? filenameMatch[1] : 'model.stl'

          // Create a blob from the response and trigger download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (error) {
        console.error('Error downloading STL:', error)
      }
    }

    if (sessionId) {
      downloadSTL()
    }
  }, [sessionId, stlId])

  return (
    <div className="max-w-md w-full mx-4 p-8 bg-zinc-800/50 backdrop-blur-sm border border-white/10 rounded-xl text-center space-y-6">
      <h1 className="text-3xl font-bold">Thank you for your purchase!</h1>
      <p className="text-zinc-300">
        {stlId ? 'Your STL file will download automatically.' : 'Your order has been confirmed.'}
      </p>
      <p className="text-zinc-300">
        You will receive a confirmation email shortly.
      </p>
      <p className="text-zinc-300">
        If you have any questions, please contact us at{' '}
        <a
          href="mailto:taiyaki.orders@gmail.com"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          taiyaki.orders@gmail.com
        </a>
      </p>
      <Link href="/" className="block mt-8">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
          Create Another Design
        </Button>
      </Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
      <Suspense fallback={
        <div className="max-w-md w-full mx-4 p-8 bg-zinc-800/50 backdrop-blur-sm border border-white/10 rounded-xl text-center">
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  )
} 