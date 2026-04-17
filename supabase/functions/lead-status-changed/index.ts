/**
 * lead-status-changed
 *
 * Thin forwarder — maps DB trigger payload to the standard event schema
 * and delegates all logic to process-automation-event.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PROCESSOR_URL =
  `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-automation-event`
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req: Request): Promise<Response> => {
  try {
    const { lead_id, old_status, new_status, changed_by } = await req.json()

    if (!lead_id || !new_status) {
      return json({ error: 'lead_id and new_status are required' }, 400)
    }

    const res = await fetch(PROCESSOR_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        entity_id:   lead_id,
        entity_type: 'lead',
        event_type:  'status_changed',
        payload:     { old_status, new_status, changed_by: changed_by ?? null },
      }),
    })

    const result = await res.json()
    return json(result, res.status)

  } catch (err) {
    console.error('[lead-status-changed]', err)
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
