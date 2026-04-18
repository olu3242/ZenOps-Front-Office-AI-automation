import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { toCSV } from '@/lib/csv'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const userSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgRow } = await userSupabase.from('user_organizations').select('organization_id').limit(1).single()
  const orgId = orgRow?.organization_id

  if (orgId) {
    const gate = await userSupabase.rpc('check_plan_limit', { p_org_id: orgId, p_metric: 'exports' })
    if (gate.data && !gate.data.allowed) {
      return NextResponse.json({ error: 'Export limit reached', gate: gate.data }, { status: 403 })
    }
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let q = supabase.from('tasks').select('title,description,due_date,assigned_to,status,created_at').order('due_date', { ascending: true, nullsFirst: false })
  if (status) q = q.eq('status', status)
  if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%,assigned_to.ilike.%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (orgId) await userSupabase.rpc('increment_usage', { p_org_id: orgId, p_metric: 'exports' })

  return new NextResponse(toCSV(data ?? []), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
