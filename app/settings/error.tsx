'use client'
import { useEffect } from 'react'
export default function SettingsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Something went wrong</p>
        <p className="text-xs text-gray-500 mb-5">{error.message}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="text-sm bg-gray-900 text-white rounded-md px-4 py-2">Try again</button>
          <a href="/ops" className="text-sm border border-gray-300 text-gray-600 rounded-md px-4 py-2">Dashboard</a>
        </div>
      </div>
    </div>
  )
}
