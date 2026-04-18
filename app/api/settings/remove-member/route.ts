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

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  if (user_id === user.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })

  const { data: target } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('organization_id', orgRow.organization_id)
    .eq('user_id', user_id)
    .single()
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove owner' }, { status: 403 })

  const { error } = await supabase
    .from('user_organizations')
    .delete()
    .eq('organization_id', orgRow.organization_id)
    .eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
