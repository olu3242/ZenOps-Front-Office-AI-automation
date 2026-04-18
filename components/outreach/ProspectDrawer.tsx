'use client'

import { useState, useEffect } from 'react'
import type { OutreachRecord, OutreachCategory, OutreachStatus } from '@/lib/outreach/types'
import type { ProspectPayload } from '@/lib/outreach/adapter'

const CATEGORIES: [OutreachCategory, string][] = [
  ['hotel',                'Hotel'],
  ['restaurant',           'Restaurant'],
  ['retail',               'Retail'],
  ['healthcare',           'Healthcare'],
  ['professional_services','Professional Services'],
  ['other',                'Other'],
]

const STATUSES: [OutreachStatus, string][] = [
  ['lead_identified',      'Lead Identified'],
  ['research_complete',    'Research Complete'],
  ['outreach_sent',        'Outreach Sent'],
  ['follow_up_1',          'Follow-up 1'],
  ['follow_up_2',          'Follow-up 2'],
  ['follow_up_3',          'Follow-up 3'],
  ['conversation_started', 'Conversation Started'],
  ['audit_offered',        'Audit Offered'],
  ['audit_booked',         'Audit Booked'],
  ['audit_completed',      'Audit Completed'],
  ['proposal_sent',        'Proposal Sent'],
  ['negotiation',          'Negotiation'],
  ['won',                  'Won'],
  ['lost',                 'Lost'],
  ['future_follow_up',     'Future Follow-up'],
]

const CHANNELS: [string, string][] = [
  ['',         'Select...'],
  ['email',    'Email'],
  ['phone',    'Phone'],
  ['linkedin', 'LinkedIn'],
  ['referral', 'Referral'],
  ['other',    'Other'],
]

interface Props {
  initial?: OutreachRecord
  saving: boolean
  onSave: (payload: ProspectPayload) => Promise<void>
  onClose: () => void
}

const BLANK: ProspectPayload = {
  business_name: '',
  category: 'other',
  status: 'lead_identified',
  city: '',
  phone: '',
  email: '',
  contact_name: '',
  contact_role: '',
  outreach_channel: '',
  notes: '',
  personalization_note: '',
}

export function ProspectDrawer({ initial, saving, onSave, onClose }: Props) {
  const isEdit = !!initial
  const [form, setForm] = useState<ProspectPayload>(() =>
    initial
      ? {
          business_name:      initial.company_name,
          category:           initial.category,
          status:             initial.status,
          city:               initial.city ?? '',
          phone:              initial.phone ?? '',
          email:              initial.contact_email ?? '',
          contact_name:       initial.contact_name ?? '',
          contact_role:       initial.contact_title ?? '',
          outreach_channel:   initial.outreach_channel ?? '',
          notes:              initial.notes ?? '',
          personalization_note: initial.personalization_note ?? '',
        }
      : { ...BLANK }
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [tab, setTab] = useState<'form' | 'templates'>('form')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field: keyof ProspectPayload, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setValidationError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.business_name.trim()) {
      setValidationError('Business name is required.')
      return
    }
    await onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {isEdit ? 'Edit Prospect' : 'Add Prospect'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none" aria-label="Close">&times;</button>
          </div>
          <div className="flex gap-4 text-sm">
            {(['form', 'templates'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-2 border-b-2 font-medium capitalize transition-colors ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'form' ? (isEdit ? 'Edit' : 'Details') : 'Email Templates'}
              </button>
            ))}
          </div>
        </div>

        {/* Templates tab */}
        {tab === 'templates' && (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <EmailTemplates prospect={form} />
          </div>
        )}

        {/* Form */}
        {tab === 'form' && (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              placeholder="e.g. Apex HVAC"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="First Last"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role / Title</label>
              <input
                type="text"
                value={form.contact_role}
                onChange={e => set('contact_role', e.target.value)}
                placeholder="Owner, GM..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Outreach Channel</label>
            <select
              value={form.outreach_channel}
              onChange={e => set('outreach_channel', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CHANNELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Personalization Note</label>
            <input
              type="text"
              value={form.personalization_note}
              onChange={e => set('personalization_note', e.target.value)}
              placeholder="Hook for first message..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Internal notes, call history, follow-up context..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {validationError && (
            <p className="text-xs text-red-600">{validationError}</p>
          )}
        </form>
        )}

        {/* Footer — only on form tab */}
        {tab === 'form' && (
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Prospect'}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------
function EmailTemplates({ prospect }: { prospect: ProspectPayload }) {
  const name = prospect.business_name || '[Business]'
  const contact = prospect.contact_name || 'there'
  const [copied, setCopied] = useState<string | null>(null)

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const templates = [
    {
      key: 'cold',
      label: 'Cold Outreach',
      subject: `Quick question for ${name}`,
      body: `Hi ${contact},

I came across ${name} and noticed you're running a busy operation. Quick question — when a new lead reaches out after hours or over the weekend, what's your current process for getting back to them?

Most service businesses I talk to lose 2-3 jobs a week just from slow follow-up. We help fix that with simple AI automation — no tech headaches.

Worth a 20-minute call to see if it's relevant to you?

Best,
[Your Name]
ZenOps`,
    },
    {
      key: 'followup1',
      label: 'Follow-up 1',
      subject: `Re: Quick question for ${name}`,
      body: `Hi ${contact},

Just wanted to bump this up in case it got buried.

The short version: we help service businesses stop losing leads to slow response times. One of our clients went from booking 60% of their inbound leads to 85% in 30 days — just by fixing their missed-call process.

Happy to share how we'd apply it to ${name} on a 20-min call. No pitch, just a look at your current setup.

Best,
[Your Name]`,
    },
    {
      key: 'followup2',
      label: 'Follow-up 2',
      subject: `Last note — ${name}`,
      body: `Hi ${contact},

I'll keep this short — last follow-up from me.

If leads, follow-up, or booking are ever a friction point for ${name}, we run a free 20-minute Front Office Audit that gives you a scored breakdown of where you're losing jobs.

Zero cost, zero pitch. Just a clear picture of what to fix.

If timing ever works: [calendar link]

[Your Name]`,
    },
    {
      key: 'audit_offer',
      label: 'Audit Offer',
      subject: `Free Front Office Audit — ${name}`,
      body: `Hi ${contact},

Based on our conversation, I'd like to offer ${name} a complimentary Front Office Audit.

In 20 minutes we'll score your operation across 6 areas — missed calls, lead response speed, estimate follow-up, no-show recovery, stale leads, and pipeline visibility.

You'll leave with a written scorecard and a clear #1 fix. No obligation.

Book here: [calendar link]

[Your Name]
ZenOps`,
    },
  ]

  return (
    <div className="space-y-4">
      {templates.map(t => (
        <div key={t.key} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">{t.label}</span>
            <button
              onClick={() => copy(t.key, `Subject: ${t.subject}\n\n${t.body}`)}
              className="text-xs text-blue-600 hover:underline"
            >
              {copied === t.key ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Subject: {t.subject}</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{t.body}</pre>
          </div>
        </div>
      ))}
    </div>
  )
}
