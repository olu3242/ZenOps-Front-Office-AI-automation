/**
 * notify-new-audit-intake
 *
 * Fired by a DB trigger after every INSERT on front_office_audits.
 * Sends a formatted email via Resend to the ops inbox so the team
 * knows instantly when a new audit request comes in.
 *
 * Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY      — Resend API key (re_...)
 *   NOTIFICATION_EMAIL  — inbox that receives the alert (e.g. ops@zenops.co)
 *   FROM_EMAIL          — verified sender (e.g. noreply@zenops.co)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface IntakePayload {
  id:                               string
  business_name:                    string
  contact_name:                     string
  email:                            string
  phone:                            string
  industry:                         string
  biggest_front_office_frustration: string
  approximate_customer_value:       string
  current_lead_flow:                string
  created_at:                       string
}

const RESEND_API_KEY     = Deno.env.get('RESEND_API_KEY')     ?? ''
const NOTIFICATION_EMAIL = Deno.env.get('NOTIFICATION_EMAIL') ?? ''
const FROM_EMAIL         = Deno.env.get('FROM_EMAIL')         ?? 'noreply@zenops.co'

serve(async (req: Request): Promise<Response> => {
  try {
    if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
      console.warn('[notify-new-audit-intake] RESEND_API_KEY or NOTIFICATION_EMAIL not set — skipping')
      return json({ skipped: 'missing env vars' })
    }

    const payload: IntakePayload = await req.json()
    const { business_name, contact_name, email, phone, industry,
            biggest_front_office_frustration, approximate_customer_value,
            current_lead_flow, created_at, id } = payload

    const submittedAt = new Date(created_at).toLocaleString('en-US', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago',
    })

    const html = buildEmail({
      business_name, contact_name, email, phone, industry,
      biggest_front_office_frustration, approximate_customer_value,
      current_lead_flow, submittedAt, id,
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [NOTIFICATION_EMAIL],
        subject: `New Audit Request — ${business_name}`,
        html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Resend API ${res.status}: ${detail}`)
    }

    const result = await res.json()
    console.log(`[notify-new-audit-intake] sent email id=${result.id} for audit ${id}`)
    return json({ success: true, email_id: result.id })

  } catch (err) {
    console.error('[notify-new-audit-intake]', err)
    return json({ error: String(err) }, 500)
  }
})

// ---------------------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------------------
interface EmailData {
  business_name:                    string
  contact_name:                     string
  email:                            string
  phone:                            string
  industry:                         string
  biggest_front_office_frustration: string
  approximate_customer_value:       string
  current_lead_flow:                string
  submittedAt:                      string
  id:                               string
}

function buildEmail(d: EmailData): string {
  const row = (label: string, value: string) =>
    value
      ? `<tr>
           <td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td>
           <td style="padding:8px 12px;font-size:13px;color:#111827">${esc(value)}</td>
         </tr>`
      : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:20px 24px">
            <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:.08em;color:#9ca3af;text-transform:uppercase">ZenOps</p>
            <h1 style="margin:4px 0 0;font-size:18px;font-weight:600;color:#ffffff">New Audit Request</h1>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:12px 24px">
            <p style="margin:0;font-size:13px;color:#166534">
              <strong>${esc(d.business_name)}</strong> submitted a Front Office Audit request at ${esc(d.submittedAt)}.
            </p>
          </td>
        </tr>

        <!-- Contact details -->
        <tr>
          <td style="padding:24px 24px 0">
            <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:.07em;color:#9ca3af;text-transform:uppercase">Contact</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f3f4f6;border-radius:6px;border-collapse:collapse">
              ${row('Business', d.business_name)}
              ${row('Contact',  d.contact_name)}
              ${row('Email',    d.email)}
              ${row('Phone',    d.phone)}
              ${row('Industry', d.industry)}
            </table>
          </td>
        </tr>

        <!-- Intake highlights -->
        <tr>
          <td style="padding:24px 24px 0">
            <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:.07em;color:#9ca3af;text-transform:uppercase">Intake Highlights</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f3f4f6;border-radius:6px;border-collapse:collapse">
              ${row('Customer value',    d.approximate_customer_value)}
              ${row('Current lead flow', d.current_lead_flow)}
              ${row('Biggest problem',   d.biggest_front_office_frustration)}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px">
            <a href="${esc(Deno.env.get('SUPABASE_URL') ? '' : '')}${'/ops/audits'}"
               style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:6px">
              View in Ops Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#d1d5db">Audit ID: ${esc(d.id)}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
