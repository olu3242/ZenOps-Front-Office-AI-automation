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
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'Edit Prospect' : 'Add Prospect'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Form */}
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

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm bg-gray-900 text-white rounded-md px-5 py-2 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Prospect'}
          </button>
        </div>
      </div>
    </div>
  )
}
