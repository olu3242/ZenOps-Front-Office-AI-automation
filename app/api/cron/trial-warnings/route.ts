import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/sender'
import { trialExpiringEmail } from '@/lib/email/templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const warningDays = [3, 1]
  let sent = 0

  for (const days of warningDays) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('organization_id, trial_ends_at, organizations(owner_id, name)')
      .eq('status', 'trialing')
      .gte('trial_ends_at', `${dateStr}T00:00:00Z`)
      .lt('trial_ends_at', `${dateStr}T23:59:59Z`)

    for (const sub of subs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = ((sub as any).organizations as { owner_id: string; name: string } | { owner_id: string; name: string }[] | null)
      const orgObj = Array.isArray(org) ? org[0] : org
      if (!orgObj?.owner_id) continue
      const { owner_id } = orgObj

      const { data: userData } = await supabase.auth.admin.getUserById(owner_id)
      const email = userData?.user?.email
      const name  = (userData?.user?.user_metadata?.name as string) ?? 'there'
      if (!email) continue

      try {
        const tpl = trialExpiringEmail({
          name,
          daysLeft: days,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        })
        await sendEmail({ to: email, subject: tpl.subject, html: tpl.html })
        sent++
      } catch { /* non-fatal */ }
    }
  }

  return NextResponse.json({ sent })
}
