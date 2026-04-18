'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Dashboard',   href: '/ops' },
  { label: 'Outreach',    href: '/ops/outreach' },
  { label: 'Audits',      href: '/ops/audits' },
  { label: 'Leads',       href: '/ops/leads' },
  { label: 'Tasks',       href: '/ops/tasks' },
  { label: 'Automation',  href: '/automation' },
  { label: 'Notifications', href: '/ops/notifications' },
]

export function OpsNav({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <div className="bg-white border-b border-gray-200 relative z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-blue-600 hover:underline">{l.label}</a>
          ))}
          <button onClick={handleSignOut} disabled={signingOut}
            className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors">
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600">
              {l.label}
            </a>
          ))}
          <button onClick={handleSignOut} disabled={signingOut}
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-50 disabled:opacity-50">
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
