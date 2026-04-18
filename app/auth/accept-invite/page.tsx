'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading'|'sign_in'|'accepting'|'done'|'error'>('loading')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') ?? ''
    setToken(t)
    if (!t) { setStatus('error'); setError('Missing invite token'); return }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) setStatus('sign_in')
      else accept(t)
    })
  }, [])

  async function accept(t: string) {
    setStatus('accepting')
    const { data: inv } = await supabase
      .from('team_invitations')
      .select('organization_id, role, expires_at, accepted_at')
      .eq('token', t)
      .single()

    if (!inv) { setStatus('error'); setError('Invalid or expired invitation'); return }
    if (inv.accepted_at) { setStatus('error'); setError('Invitation already used'); return }
    if (new Date(inv.expires_at) < new Date()) { setStatus('error'); setError('Invitation expired'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('sign_in'); return }

    await supabase.from('user_organizations').upsert({
      user_id: user.id,
      organization_id: inv.organization_id,
      role: inv.role,
    }, { onConflict: 'user_id,organization_id' })

    await supabase.from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', t)

    setStatus('done')
    setTimeout(() => router.push('/ops'), 1500)
  }

  if (status === 'sign_in') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Sign in to accept your invitation</p>
          <a href={`/auth/signin?next=/auth/accept-invite?token=${token}`}
            className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 inline-block hover:bg-gray-700 transition-colors">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        {status === 'loading'    && <p className="text-sm text-gray-400">Verifying...</p>}
        {status === 'accepting'  && <p className="text-sm text-gray-400">Joining team...</p>}
        {status === 'done'       && <p className="text-sm text-teal-700 font-medium">Invitation accepted! Redirecting...</p>}
        {status === 'error'      && (
          <>
            <p className="text-sm font-semibold text-gray-900 mb-2">Invitation Error</p>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <a href="/ops" className="text-sm text-blue-600 hover:underline">Go to dashboard</a>
          </>
        )}
      </div>
    </div>
  )
}
