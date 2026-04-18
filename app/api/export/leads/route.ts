import { createClient } from '@supabase/supabase-js'
import { toCSV } from '@/lib/csv'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let q = supabase.from('leads').select('business_name,contact_name,email,phone,source,status,notes,created_at').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (search) q = q.or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(toCSV(data ?? []), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
