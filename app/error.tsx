'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Something went wrong</p>
        <p className="text-xs text-gray-500 mb-5">{error.message}</p>
        <button onClick={reset} className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 hover:bg-gray-700 transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
