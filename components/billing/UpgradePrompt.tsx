'use client'

import { useState } from 'react'
import type { PlanId } from '@/lib/billing/types'

const REASON_COPY: Record<string, string> = {
  limit_reached:         "You've hit your plan limit.",
  trial_expired:         'Your trial has expired.',
  subscription_inactive: 'Your subscription is inactive.',
}

export function UpgradePrompt({
  reason,
  metric,
  currentPlan,
  className = '',
}: {
  reason: string
  metric?: string
  currentPlan?: PlanId
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(planId: string) {
    setLoading(true)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  const upgradeTo = currentPlan === 'starter' ? 'growth' : currentPlan === 'growth' ? 'elite' : 'starter'
  const upgradeLabel = upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)

  return (
    <div className={`flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orange-900">
          {REASON_COPY[reason] ?? 'Upgrade required.'}{metric ? ` (${metric})` : ''}
        </p>
        <p className="text-xs text-orange-700 mt-0.5">Upgrade to continue.</p>
      </div>
      <button
        onClick={() => handleUpgrade(upgradeTo)}
        disabled={loading}
        className="text-xs font-medium bg-orange-600 text-white rounded-md px-3 py-1.5 hover:bg-orange-700 transition-colors disabled:opacity-50 shrink-0">
        {loading ? '...' : `Upgrade to ${upgradeLabel}`}
      </button>
      <a href="/billing" className="text-xs text-orange-600 hover:underline shrink-0">View plans</a>
    </div>
  )
}

export function SoftLimitBanner({ pct, metric, currentPlan }: { pct: number; metric: string; currentPlan?: PlanId }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || pct < 80) return null
  return (
    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 mb-4">
      <p className="text-xs text-yellow-800 flex-1">
        {pct >= 100 ? `${metric} limit reached` : `${pct}% of ${metric} limit used`} — consider upgrading.
      </p>
      <a href="/billing" className="text-xs font-medium text-yellow-700 hover:underline">Upgrade</a>
      <button onClick={() => setDismissed(true)} className="text-yellow-500 hover:text-yellow-700 text-xs">✕</button>
    </div>
  )
}
