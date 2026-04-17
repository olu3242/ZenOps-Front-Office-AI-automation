/**
 * audit-status-changed
 *
 * Thin forwarder — receives a DB trigger payload and hands it to the
 * central automation processor.  All rule evaluation and action execution
 * happens in process-automation-event; this function has no inline logic.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PROCESSOR_URL =
  `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-automation-event`
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req: Request): Promise<Response> => {
  try {
    const { audit_id, old_status, new_status, changed_by } = await req.json()

    if (!audit_id || !new_status) {
      return json({ error: 'audit_id and new_status are required' }, 400)
    }

    const res = await fetch(PROCESSOR_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        entity_id:   audit_id,
        entity_type: 'audit',
        event_type:  'status_changed',
        payload:     { old_status, new_status, changed_by: changed_by ?? null },
      }),
    })

    const result = await res.json()
    return json(result, res.status)

  } catch (err) {
    console.error('[audit-status-changed]', err)
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
