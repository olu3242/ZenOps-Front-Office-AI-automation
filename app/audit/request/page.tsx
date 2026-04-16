'use client'

import { useState } from 'react'
import { submitAuditRequest } from '@/lib/audits/adapter'

const BLANK: Record<string, string> = {
  business_name: '',
  website: '',
  industry: '',
  contact_name: '',
  email: '',
  phone: '',
  best_contact_method: '',
  lead_sources: '',
  current_lead_flow: '',
  inbound_owner: '',
  response_speed: '',
  missed_call_process: '',
  post_estimate_process: '',
  follow_up_owner: '',
  approximate_customer_value: '',
  biggest_front_office_frustration: '',
}

export default function AuditRequestPage() {
  const [form, setForm] = useState<Record<string, string>>(BLANK)
  const [pageState, setPageState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function set(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPageState('loading')
    setErrorMsg(null)
    try {
      await submitAuditRequest(form)
      setPageState('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPageState('error')
    }
  }

  if (pageState === 'success') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-xl font-semibold text-gray-900">Request received</h1>
          <p className="text-sm text-gray-500 mt-2">
            We’ll be in touch within 1 business day to schedule your audit call.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Request a Front Office Audit</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tell us about your business and how your front office works today.
            We’ll identify your biggest revenue leaks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">About Your Business</h2>
            <div className="space-y-4">
              <F label="Business Name" name="business_name" value={form.business_name} set={set} required />
              <F label="Website" name="website" value={form.website} set={set} type="url" placeholder="https://" />
              <F label="Industry" name="industry" value={form.industry} set={set} placeholder="e.g. HVAC, Roofing, Law Firm, Clinic" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Contact Info</h2>
            <div className="space-y-4">
              <F label="Your Name" name="contact_name" value={form.contact_name} set={set} required />
              <F label="Email" name="email" type="email" value={form.email} set={set} required />
              <F label="Phone" name="phone" type="tel" value={form.phone} set={set} />
              <SF
                label="Best way to reach you"
                name="best_contact_method"
                value={form.best_contact_method}
                set={set}
                options={[['', 'Select…'], ['email', 'Email'], ['phone', 'Phone call'], ['text', 'Text message']]}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Your Lead Flow</h2>
            <div className="space-y-4">
              <TA label="Where do most of your leads come from?" name="lead_sources" value={form.lead_sources} set={set} />
              <TA label="What happens when a new lead contacts you?" name="current_lead_flow" value={form.current_lead_flow} set={set} />
              <F label="Who handles incoming leads?" name="inbound_owner" value={form.inbound_owner} set={set} placeholder="e.g. Owner, office manager, dispatcher" />
              <F label="How fast do you typically respond to a new lead?" name="response_speed" value={form.response_speed} set={set} placeholder="e.g. Same day, within the hour" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Your Process</h2>
            <div className="space-y-4">
              <TA label="What happens when you miss a call?" name="missed_call_process" value={form.missed_call_process} set={set} />
              <TA label="What happens after you send an estimate?" name="post_estimate_process" value={form.post_estimate_process} set={set} />
              <F label="Who owns follow-up with prospects?" name="follow_up_owner" value={form.follow_up_owner} set={set} placeholder="e.g. Owner, sales rep, nobody" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">A Bit More Context</h2>
            <div className="space-y-4">
              <F label="Approximate value of a typical customer?" name="approximate_customer_value" value={form.approximate_customer_value} set={set} placeholder="e.g. $500/job, $3k/year" />
              <TA label="Biggest front office frustration right now?" name="biggest_front_office_frustration" value={form.biggest_front_office_frustration} set={set} rows={4} />
            </div>
          </section>

          {pageState === 'error' && errorMsg && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={pageState === 'loading'}
            className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {pageState === 'loading' ? 'Submitting…' : 'Submit Audit Request'}
          </button>

        </form>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Internal field helpers — use set(name, value) to avoid React event union types
// ---------------------------------------------------------------------------

function F({
  label, name, value, set, required, type = 'text', placeholder,
}: {
  label: string; name: string; value: string
  set: (name: string, value: string) => void
  required?: boolean; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type} name={name} value={value} required={required} placeholder={placeholder}
        onChange={e => set(name, e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function TA({
  label, name, value, set, rows = 3,
}: {
  label: string; name: string; value: string
  set: (name: string, value: string) => void; rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        name={name} value={value} rows={rows}
        onChange={e => set(name, e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    </div>
  )
}

function SF({
  label, name, value, set, options,
}: {
  label: string; name: string; value: string
  set: (name: string, value: string) => void
  options: [string, string][]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name} value={value}
        onChange={e => set(name, e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}
