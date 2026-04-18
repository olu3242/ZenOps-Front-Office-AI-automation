import { supabase } from '@/lib/supabase'
import type { BillingState, Plan, Subscription, OrgUsage, PlanGateResult } from './types'

export async function getCurrentOrgId(): Promise<string | null> {
  const { data } = await supabase.from('user_organizations').select('organization_id').limit(1).single()
  return data?.organization_id ?? null
}

export async function getBillingState(): Promise<BillingState | null> {
  const orgId = await getCurrentOrgId()
  if (!orgId) return null

  const period = new Date().toISOString().slice(0, 7) + '-01'

  const [subRes, usageRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('organization_usage')
      .select('*')
      .eq('organization_id', orgId)
      .eq('period_start', period)
      .maybeSingle(),
  ])

  if (!subRes.data) return null

  const sub = subRes.data as Subscription & { plans: Plan }
  const plan = sub.plans
  const usage = usageRes.data as OrgUsage | null

  const trialDaysLeft = sub.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null

  const isActive = ['trialing', 'active'].includes(sub.status) &&
    (sub.status !== 'trialing' || (trialDaysLeft !== null && trialDaysLeft > 0))

  return { plan, subscription: sub, usage, org_id: orgId, trial_days_left: trialDaysLeft, is_active: isActive }
}

export async function checkGate(orgId: string, metric: string): Promise<PlanGateResult> {
  const { data, error } = await supabase.rpc('check_plan_limit', { p_org_id: orgId, p_metric: metric })
  if (error) throw new Error(error.message)
  return data as PlanGateResult
}

export async function fetchAllPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from('plans').select('*').order('price_monthly_cents')
  if (error) throw new Error(error.message)
  return data as Plan[]
}
