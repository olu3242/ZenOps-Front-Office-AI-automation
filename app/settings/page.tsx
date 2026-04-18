'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getBillingState } from '@/lib/billing/adapter'
import { OpsNav } from '@/components/ui/OpsNav'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { BillingState } from '@/lib/billing/types'

interface Member {
  user_id: string
  email: string
  name: string | null
  role: string
  joined_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

export default function SettingsPage() {
  const { toasts, addToast, dismiss } = useToast()
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [billing, setBilling] = useState<BillingState | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member'|'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const [{ data: { user } }, billState] = await Promise.all([
      supabase.auth.getUser(),
      getBillingState(),
    ])
    if (user) {
      setCurrentUser({ id: user.id, email: user.email ?? '' })
      setProfileName((user.user_metadata?.name as string) ?? '')
    }
    setBilling(billState)

    if (billState?.org_id) {
      const [membersRes, invRes] = await Promise.all([
        supabase.from('org_members').select('*').eq('organization_id', billState.org_id),
        supabase.from('team_invitations')
          .select('id, email, role, created_at, expires_at')
          .eq('organization_id', billState.org_id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
      ])
      setMembers((membersRes.data ?? []) as Member[])
      setInvitations((invRes.data ?? []) as Invitation[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSaveProfile() {
    setSavingProfile(true)
    const { error } = await supabase.auth.updateUser({ data: { name: profileName } })
    if (error) addToast('Failed to update profile', 'error')
    else addToast('Profile updated', 'success')
    setSavingProfile(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteResult(null)
    const res = await fetch('/api/settings/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      addToast(data.error ?? 'Failed to invite', 'error')
    } else {
      setInviteResult({ url: data.invite_url })
      setInviteEmail('')
      await load()
      addToast('Invitation created', 'success')
    }
    setInviting(false)
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId)
    const res = await fetch('/api/settings/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await res.json()
    if (!res.ok) addToast(data.error ?? 'Failed to remove', 'error')
    else { setMembers(prev => prev.filter(m => m.user_id !== userId)); addToast('Member removed', 'info') }
    setRemovingId(null)
  }

  async function handleRevokeInvite(id: string) {
    await supabase.from('team_invitations').delete().eq('id', id)
    setInvitations(prev => prev.filter(i => i.id !== id))
    addToast('Invitation revoked', 'info')
  }

  function copyInviteUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const usersLimit = billing?.plan.users_limit
  const canInvite = currentUser && members.find(m => m.user_id === currentUser.id && ['owner','admin'].includes(m.role))
  const atLimit = usersLimit !== null && usersLimit !== undefined && members.length >= usersLimit

  return (
    <div className="min-h-screen bg-gray-50">
      <OpsNav title="Settings" subtitle="Profile & team" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading && <div className="py-20 text-center text-sm text-gray-400">Loading...</div>}

        {!loading && (
          <>
            {/* Profile */}
            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Profile</h2>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{currentUser?.email}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Display name</label>
                  <input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </section>

            {/* Team */}
            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Team members ({members.length}{usersLimit ? ` / ${usersLimit}` : ''})
                </h2>
                {atLimit && (
                  <a href="/billing" className="text-xs text-orange-600 hover:underline">Upgrade for more seats</a>
                )}
              </div>

              <div className="divide-y divide-gray-100 mb-6">
                {members.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name || m.email}</p>
                      {m.name && <p className="text-xs text-gray-500">{m.email}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 capitalize">{m.role}</span>
                      {canInvite && m.role !== 'owner' && m.user_id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemove(m.user_id)}
                          disabled={removingId === m.user_id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                          {removingId === m.user_id ? '...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending invitations */}
              {invitations.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pending invitations</p>
                  <div className="divide-y divide-gray-100">
                    {invitations.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm text-gray-700">{inv.email}</p>
                          <p className="text-xs text-gray-400 capitalize">{inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                        </div>
                        {canInvite && (
                          <button onClick={() => handleRevokeInvite(inv.id)}
                            className="text-xs text-gray-400 hover:text-red-600">Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite form */}
              {canInvite && !atLimit && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Invite member</p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="email@company.com"
                      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member'|'admin')}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                      className="text-sm bg-gray-900 text-white rounded-md px-4 py-1.5 hover:bg-gray-700 transition-colors disabled:opacity-50">
                      {inviting ? 'Inviting...' : 'Send invite'}
                    </button>
                  </div>

                  {inviteResult && (
                    <div className="mt-3 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-teal-800 flex-1 truncate">{inviteResult.url}</p>
                      <button onClick={() => copyInviteUrl(inviteResult.url)}
                        className="text-xs font-medium text-teal-700 hover:underline shrink-0">
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canInvite && atLimit && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-orange-700">
                    You&apos;ve reached the {usersLimit}-seat limit on your {billing?.plan.name} plan.{' '}
                    <a href="/billing" className="underline">Upgrade</a> for more seats.
                  </p>
                </div>
              )}
            </section>

            {/* Org info */}
            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Organization</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex gap-4">
                  <span className="text-gray-400 w-32">Plan</span>
                  <span className="font-medium">{billing?.plan.name ?? '—'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400 w-32">Status</span>
                  <span className="capitalize">{billing?.subscription.status ?? '—'}</span>
                </div>
                {billing?.trial_days_left !== null && billing?.trial_days_left !== undefined && billing.trial_days_left >= 0 && billing.subscription.status === 'trialing' && (
                  <div className="flex gap-4">
                    <span className="text-gray-400 w-32">Trial ends</span>
                    <span className="text-orange-600">{billing.trial_days_left} day{billing.trial_days_left !== 1 ? 's' : ''} left</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <a href="/billing" className="text-xs text-blue-600 hover:underline">Manage billing →</a>
              </div>
            </section>
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
