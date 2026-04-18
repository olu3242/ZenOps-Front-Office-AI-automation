'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createLead } from '@/lib/leads/adapter'
import type { LeadStatus } from '@/lib/leads/types'

const BUSINESS_TYPES = [
  { id: 'dental',    icon: '🦷', label: 'Dental Practice',   desc: 'Appointment follow-ups, patient pipeline' },
  { id: 'hvac',      icon: '❄️', label: 'HVAC Company',      desc: 'Service leads, seasonal campaigns' },
  { id: 'lawn_care', icon: '🌿', label: 'Lawn & Landscape',  desc: 'Quote follow-ups, recurring clients' },
  { id: 'other',     icon: '🏢', label: 'Other Service Biz', desc: 'Custom front-office automation' },
]

const TOTAL_STEPS = 4

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < current ? 'bg-teal-500 text-gray-950' :
            i === current ? 'bg-teal-500/20 border-2 border-teal-500 text-teal-400' :
            'bg-white/5 border border-white/10 text-gray-600'
          }`}>{i < current ? '✓' : i + 1}</div>
          {i < TOTAL_STEPS - 1 && <div className={`h-px w-8 ${i < current ? 'bg-teal-500' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState(0)
  const [orgId, setOrgId]             = useState<string | null>(null)
  const [businessType, setBusinessType] = useState('')
  const [leadName, setLeadName]       = useState('')
  const [leadPhone, setLeadPhone]     = useState('')
  const [leadEmail, setLeadEmail]     = useState('')
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const loadOrg = useCallback(async () => {
    const { data } = await supabase.from('user_organizations').select('organization_id').limit(1).single()
    if (data) {
      setOrgId(data.organization_id)
      const { data: prog } = await supabase
        .from('onboarding_progress')
        .select('step_completed, business_type, completed_at')
        .eq('organization_id', data.organization_id)
        .maybeSingle()
      if (prog?.completed_at) { router.replace('/ops'); return }
      if (prog?.step_completed) setStep(prog.step_completed)
      if (prog?.business_type) setBusinessType(prog.business_type)
    }
  }, [router])

  useEffect(() => { loadOrg() }, [loadOrg])

  async function saveProgress(newStep: number, extra: Record<string, unknown> = {}) {
    if (!orgId) return
    await supabase.from('onboarding_progress').upsert({
      organization_id: orgId,
      step_completed: newStep,
      business_type: businessType || null,
      ...extra,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id' })
  }

  async function handleSelectBusiness(type: string) {
    setBusinessType(type)
    setSaving(true)
    await saveProgress(1, { business_type: type })
    setSaving(false)
    setStep(1)
  }

  async function handleAddLead() {
    if (!leadName.trim()) { setError('Lead name is required'); return }
    setSaving(true)
    setError(null)
    try {
      await createLead({
        business_name: leadName,
        contact_name: leadName,
        email: leadEmail || null,
        phone: leadPhone || null,
        source: 'onboarding',
        status: 'new' as LeadStatus,
        notes: null,
      })
      await saveProgress(2)
      setStep(2)
    } catch {
      setError('Failed to add lead. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEnableAutomation() {
    setSaving(true)
    if (autoEnabled && orgId) {
      await supabase.from('automation_rules').insert({
        name: 'Auto follow-up after 5 minutes',
        entity_type: 'lead',
        trigger: 'lead_created',
        conditions: [],
        actions: [{ type: 'notify', payload: { message: 'New lead added — follow up within 5 minutes!' } }],
        is_active: true,
      })
    }
    await saveProgress(3)
    setSaving(false)
    setStep(3)
  }

  async function handleInvite() {
    setSaving(true)
    if (inviteEmail.trim()) {
      await fetch('/api/settings/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: 'member' }),
      })
    }
    await saveProgress(4, { completed_at: new Date().toISOString() })
    setSaving(false)
    router.push('/ops')
  }

  async function handleSkipInvite() {
    await saveProgress(4, { completed_at: new Date().toISOString() })
    router.push('/ops')
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-2">Setup</p>
          <h1 className="text-2xl font-bold text-white">Welcome to ZenOps</h1>
          <p className="text-sm text-gray-400 mt-1">Let&apos;s get your front office running in 3 minutes</p>
        </div>

        <StepIndicator current={step} />

        {/* Step 0: Business type */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">What type of business do you run?</h2>
            <p className="text-sm text-gray-400 mb-6">We&apos;ll pre-configure ZenOps for your niche.</p>
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map(b => (
                <button key={b.id} onClick={() => handleSelectBusiness(b.id)}
                  disabled={saving}
                  className={`text-left bg-white/[0.04] border rounded-xl p-4 hover:bg-white/[0.08] hover:border-teal-500/40 transition-all disabled:opacity-50 ${
                    businessType === b.id ? 'border-teal-500/60 bg-teal-500/10' : 'border-white/10'
                  }`}>
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <p className="text-sm font-medium text-white">{b.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Add first lead */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Add your first lead</h2>
            <p className="text-sm text-gray-400 mb-6">This puts a real record in your pipeline right away.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Name <span className="text-red-400">*</span></label>
                <input value={leadName} onChange={e => setLeadName(e.target.value)}
                  placeholder="e.g. Smith Residence"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} type="tel"
                  placeholder="(555) 000-0000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} type="email"
                  placeholder="lead@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleAddLead} disabled={saving}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add lead →'}
                </button>
                <button onClick={async () => { await saveProgress(2); setStep(2) }}
                  className="text-sm text-gray-500 hover:text-gray-300 px-4">Skip</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enable automation */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Enable your first automation</h2>
            <p className="text-sm text-gray-400 mb-6">This rule fires the moment a new lead is added.</p>
            <div
              onClick={() => setAutoEnabled(v => !v)}
              className={`border rounded-2xl p-5 cursor-pointer transition-all mb-6 ${
                autoEnabled ? 'bg-teal-500/10 border-teal-500/40' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  autoEnabled ? 'border-teal-400 bg-teal-400' : 'border-white/20'
                }`}>
                  {autoEnabled && <div className="w-2 h-2 rounded-full bg-gray-950" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Auto follow-up after 5 minutes</p>
                  <p className="text-xs text-gray-400 mt-1">When a new lead is added → send internal notification to follow up within 5 minutes.</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs bg-blue-500/20 text-blue-300 rounded px-2 py-0.5">Trigger: lead_created</span>
                    <span className="text-xs bg-teal-500/20 text-teal-300 rounded px-2 py-0.5">Action: notify</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleEnableAutomation} disabled={saving}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : autoEnabled ? 'Enable & continue →' : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Invite team */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Invite a team member</h2>
            <p className="text-sm text-gray-400 mb-6">Add your front desk, VA, or business partner. They&apos;ll get an invite link.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email address</label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email"
                  placeholder="teammate@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleInvite} disabled={saving || !inviteEmail.trim()}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? 'Sending...' : 'Send invite & finish →'}
                </button>
                <button onClick={handleSkipInvite} className="text-sm text-gray-500 hover:text-gray-300 px-4">
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
