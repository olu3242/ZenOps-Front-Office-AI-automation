import { supabase } from '@/lib/supabase'
import type { PlanGateResult } from './types'

export class PlanLimitError extends Error {
  constructor(public readonly gate: PlanGateResult) {
    super(gate.reason)
    this.name = 'PlanLimitError'
  }
}

export async function assertCanCreate(orgId: string, metric: string): Promise<void> {
  const { data, error } = await supabase.rpc('check_plan_limit', { p_org_id: orgId, p_metric: metric })
  if (error) throw new Error(error.message)
  const gate = data as PlanGateResult
  if (!gate.allowed) throw new PlanLimitError(gate)
}

export function usageColor(pct: number | null): string {
  if (pct === null) return 'bg-gray-200'
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80)  return 'bg-orange-400'
  return 'bg-teal-500'
}

export function isNearLimit(pct: number | null): boolean {
  return pct !== null && pct >= 80
}
