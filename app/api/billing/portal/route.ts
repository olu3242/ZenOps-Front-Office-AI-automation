import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'
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

  const { data: orgRow } = await supabase
    .from('user_organizations').select('organization_id').limit(1).single()
  if (!orgRow) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations').select('stripe_customer_id').eq('id', orgRow.organization_id).single()
  if (!org?.stripe_customer_id) return NextResponse.json({ error: 'No billing account' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer:   org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
