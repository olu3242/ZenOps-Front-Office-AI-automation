'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
          <p className="text-sm text-gray-400">We&apos;ll send a reset link to your email</p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <p className="text-sm text-white font-medium mb-2">Check your email</p>
              <p className="text-xs text-gray-400 mb-6">We sent a reset link to <strong>{email}</strong></p>
              <Link href="/auth/signin" className="text-sm text-teal-400 hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-xs text-gray-500">
                <Link href="/auth/signin" className="text-teal-400 hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
