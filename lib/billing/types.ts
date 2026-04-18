export type PlanId = 'trial' | 'starter' | 'growth' | 'elite'
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

export interface Plan {
  id: PlanId
  name: string
  stripe_price_id: string | null
  price_monthly_cents: number
  leads_limit: number | null
  automations_limit: number | null
  users_limit: number | null
  exports_limit: number | null
  outreach_limit: number | null
  features: string[]
}

export interface Subscription {
  id: string
  organization_id: string
  plan_id: PlanId
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface OrgUsage {
  organization_id: string
  period_start: string
  leads_count: number
  automations_count: number
  exports_count: number
  outreach_count: number
}

export interface PlanGateResult {
  allowed: boolean
  reason: 'ok' | 'unlimited' | 'limit_reached' | 'trial_expired' | 'subscription_inactive'
  limit: number | null
  current: number
  pct: number | null
}

export interface BillingState {
  plan: Plan
  subscription: Subscription
  usage: OrgUsage | null
  org_id: string
  trial_days_left: number | null
  is_active: boolean
}

export const PLAN_ORDER: PlanId[] = ['trial', 'starter', 'growth', 'elite']

export const PLAN_DISPLAY: Record<PlanId, { color: string; badge: string }> = {
  trial:   { color: 'bg-gray-100 text-gray-700',   badge: 'Trial' },
  starter: { color: 'bg-blue-100 text-blue-700',   badge: 'Starter' },
  growth:  { color: 'bg-purple-100 text-purple-700', badge: 'Growth' },
  elite:   { color: 'bg-amber-100 text-amber-700', badge: 'Elite' },
}
