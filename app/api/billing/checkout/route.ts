import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe, PLAN_PRICE_MAP } from '@/lib/stripe'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_id } = await req.json()
  const priceId = PLAN_PRICE_MAP[plan_id]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: orgRow } = await supabase
    .from('user_organizations').select('organization_id').limit(1).single()
  if (!orgRow) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: orgData } = await supabase
    .from('organizations').select('stripe_customer_id, name').eq('id', orgRow.organization_id).single()

  let customerId = orgData?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: orgData?.name,
      metadata: { org_id: orgRow.organization_id, user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', orgRow.organization_id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
    metadata: { org_id: orgRow.organization_id, plan_id },
    subscription_data: {
      trial_period_days: undefined,
      metadata: { org_id: orgRow.organization_id },
    },
  })

  return NextResponse.json({ url: session.url })
}
