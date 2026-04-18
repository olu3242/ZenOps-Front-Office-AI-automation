'use client'

import { useEffect, useState } from 'react'
import { getBillingState } from '@/lib/billing/adapter'
import type { BillingState } from '@/lib/billing/types'

export function usePlan() {
  const [state, setState] = useState<BillingState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBillingState().then(s => { setState(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function canUse(feature: string): boolean {
    if (!state) return true
    return state.plan.features.includes(feature)
  }

  function usagePct(metric: keyof Pick<BillingState['usage'] & object, 'leads_count' | 'automations_count' | 'exports_count' | 'outreach_count'>): number | null {
    if (!state?.usage) return 0
    const limitKey = metric.replace('_count', '_limit') as keyof typeof state.plan
    const limit = state.plan[limitKey] as number | null
    if (limit === null) return null
    return Math.round((state.usage[metric] / limit) * 100)
  }

  return { state, loading, canUse, usagePct }
}
