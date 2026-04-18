import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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
    .from('user_organizations').select('organization_id, role').eq('user_id', user.id).single()
  if (!orgRow || !['owner','admin'].includes(orgRow.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orgId = orgRow.organization_id

  const gate = await supabase.rpc('check_plan_limit', { p_org_id: orgId, p_metric: 'users' })
  if (gate.data && !gate.data.allowed)
    return NextResponse.json({ error: 'User limit reached', gate: gate.data }, { status: 403 })

  const { email, role = 'member' } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const existing = await supabase
    .from('team_invitations')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email.toLowerCase())
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (existing.data) return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 })

  const { data: inv, error } = await supabase
    .from('team_invitations')
    .insert({ organization_id: orgId, email: email.toLowerCase(), role, invited_by: user.id })
    .select('token')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inv.token}`

  return NextResponse.json({ token: inv.token, invite_url: inviteUrl })
}
