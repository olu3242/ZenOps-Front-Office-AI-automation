'use client'

import { useEffect, useState } from 'react'
import { getBillingState, fetchAllPlans } from '@/lib/billing/adapter'
import { PLAN_DISPLAY } from '@/lib/billing/types'
import { UsageBar } from '@/components/billing/UsageBar'
import { OpsNav } from '@/components/ui/OpsNav'
import type { BillingState, Plan } from '@/lib/billing/types'

function fmt(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)}/mo`
}

export default function BillingPage() {
  const [billing, setBilling]   = useState<BillingState | null>(null)
  const [plans, setPlans]       = useState<Plan[]>([])
  const [loading, setLoading]   = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search))
    Promise.all([getBillingState(), fetchAllPlans()])
      .then(([b, p]) => { setBilling(b); setPlans(p) })
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setUpgrading(null)
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setPortalLoading(false)
  }

  const b = billing
  const u = b?.usage
  const p = b?.plan

  const usagePct = (current: number, limit: number | null) =>
    limit === null ? null : Math.round((current / limit) * 100)

  const usageRows = u && p ? [
    { label: 'Leads',       current: u.leads_count,       limit: p.leads_limit,       pct: usagePct(u.leads_count, p.leads_limit) },
    { label: 'Automations', current: u.automations_count, limit: p.automations_limit, pct: usagePct(u.automations_count, p.automations_limit) },
    { label: 'Exports',     current: u.exports_count,     limit: p.exports_limit,     pct: usagePct(u.exports_count, p.exports_limit) },
    { label: 'Outreach',    current: u.outreach_count,    limit: p.outreach_limit,    pct: usagePct(u.outreach_count, p.outreach_limit) },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <OpsNav title="Billing" subtitle="Plan & usage" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {searchParams?.get('success') === '1' && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-sm text-teal-800">
            Subscription activated — thank you!
          </div>
        )}
        {searchParams?.get('canceled') === '1' && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
            Checkout canceled. Your plan is unchanged.
          </div>
        )}

        {loading && <div className="py-20 text-center text-sm text-gray-400">Loading...</div>}

        {!loading && b && (
          <>
            {/* Current plan */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Current Plan</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">{p?.name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_DISPLAY[b.subscription.plan_id].color}`}>
                      {b.subscription.status}
                    </span>
                  </div>
                  {b.trial_days_left !== null && b.trial_days_left > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      {b.trial_days_left} day{b.trial_days_left !== 1 ? 's' : ''} left in trial
                    </p>
                  )}
                  {b.trial_days_left === 0 && b.subscription.status === 'trialing' && (
                    <p className="text-sm text-red-600 mt-1">Trial expired — upgrade to continue</p>
                  )}
                  {b.subscription.cancel_at_period_end && (
                    <p className="text-sm text-orange-600 mt-1">
                      Cancels {b.subscription.current_period_end ? new Date(b.subscription.current_period_end).toLocaleDateString() : 'at period end'}
                    </p>
                  )}
                </div>
                {b.subscription.stripe_subscription_id && (
                  <button onClick={handlePortal} disabled={portalLoading}
                    className="text-sm border border-gray-300 text-gray-600 rounded-md px-4 py-2 hover:border-gray-400 transition-colors disabled:opacity-50">
                    {portalLoading ? 'Loading...' : 'Manage subscription'}
                  </button>
                )}
              </div>

              {/* Usage bars */}
              {usageRows.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">This Month</p>
                  {usageRows.map(r => (
                    <UsageBar key={r.label} label={r.label} current={r.current} limit={r.limit} pct={r.pct} />
                  ))}
                </div>
              )}
            </div>

            {/* Plan comparison */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Available Plans</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {plans.filter(plan => plan.id !== 'trial').map(plan => {
                  const isCurrent = plan.id === b.subscription.plan_id
                  return (
                    <div key={plan.id} className={`bg-white border rounded-xl p-5 ${isCurrent ? 'border-teal-400 ring-1 ring-teal-400' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        {isCurrent && <span className="text-xs text-teal-600 font-medium">Current</span>}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-3">{fmt(plan.price_monthly_cents)}</p>
                      <ul className="space-y-1.5 mb-5 text-xs text-gray-600">
                        <li>{plan.leads_limit === null ? 'Unlimited' : plan.leads_limit.toLocaleString()} leads/mo</li>
                        <li>{plan.automations_limit === null ? 'Unlimited' : plan.automations_limit} automation runs/mo</li>
                        <li>{plan.users_limit === null ? 'Unlimited' : plan.users_limit} user{plan.users_limit !== 1 ? 's' : ''}</li>
                        <li>{plan.exports_limit === null ? 'Unlimited' : plan.exports_limit} CSV exports/mo</li>
                        <li>{plan.outreach_limit === null ? 'Unlimited' : plan.outreach_limit.toLocaleString()} outreach/mo</li>
                      </ul>
                      {!isCurrent && (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={upgrading === plan.id}
                          className="w-full text-sm bg-gray-900 text-white rounded-md py-2 hover:bg-gray-700 transition-colors disabled:opacity-50">
                          {upgrading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {!loading && !b && (
          <div className="py-20 text-center text-sm text-gray-400">
            No billing account found. Please contact support.
          </div>
        )}
      </div>
    </div>
  )
}
