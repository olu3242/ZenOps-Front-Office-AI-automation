import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function periodStart(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_start ?? (item as any)?.current_period_start
  return raw ? new Date(raw * 1000).toISOString() : null
}
function periodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_end ?? (item as any)?.current_period_end
  return raw ? new Date(raw * 1000).toISOString() : null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const orgId  = session.metadata?.org_id
      const planId = session.metadata?.plan_id
      const subId  = session.subscription as string
      if (!orgId || !planId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trialEnd = (sub as any).trial_end as number | null

      await supabase.from('subscriptions').upsert({
        organization_id:        orgId,
        plan_id:                planId,
        stripe_subscription_id: subId,
        stripe_customer_id:     session.customer as string,
        status:                 sub.status,
        trial_ends_at:          trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
        current_period_start:   periodStart(sub),
        current_period_end:     periodEnd(sub),
        cancel_at_period_end:   sub.cancel_at_period_end,
        updated_at:             new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const orgId = sub.metadata?.org_id
      if (!orgId) break
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trialEnd = (sub as any).trial_end as number | null

      const planId = await resolveStripePlanId(sub.items.data[0]?.price.id)
      await supabase.from('subscriptions')
        .update({
          ...(planId ? { plan_id: planId } : {}),
          status:               sub.status,
          trial_ends_at:        trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
          current_period_start: periodStart(sub),
          current_period_end:   periodEnd(sub),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at:           new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription?.id ?? null)
      if (subId) {
        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function resolveStripePlanId(priceId: string | undefined): Promise<string | null> {
  if (!priceId) return null
  const { data } = await supabase.from('plans').select('id').eq('stripe_price_id', priceId).single()
  return data?.id ?? null
}
