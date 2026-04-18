'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(searchParams.get('next') ?? '/ops')
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const next = searchParams.get('next') ?? '/ops'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-white">ZenOps</Link>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50 mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" /><span className="text-xs text-gray-500">or</span><div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <Link href="/auth/reset-password" className="text-xs text-gray-500 hover:text-teal-400 transition-colors">Forgot password?</Link>
              </div>
              <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            No account?{' '}<Link href="/auth/signup" className="text-teal-400 hover:underline">Start free trial</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return <Suspense><SignInForm /></Suspense>
}
