import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface LeadStatusPayload {
  lead_id: string
  old_status: string
  new_status: string
  changed_by?: string
}

serve(async (req: Request): Promise<Response> => {
  try {
    const payload: LeadStatusPayload = await req.json()
    const { lead_id, old_status, new_status, changed_by } = payload

    if (!lead_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'lead_id and new_status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[lead-status-changed] ${lead_id}: ${old_status} → ${new_status} (by ${changed_by ?? 'system'})`)

    // -----------------------------------------------------------------------
    // Automation routing
    // -----------------------------------------------------------------------

    if (new_status === 'contacted') {
      // TODO: start cadence timer, log first-touch in CRM
      console.log(`[lead-status-changed] Lead ${lead_id} contacted → start follow-up cadence`)
    }

    if (new_status === 'qualified') {
      // TODO: assign to sales rep, trigger outreach sequence, create audit task
      console.log(`[lead-status-changed] Lead ${lead_id} qualified → trigger sales sequence`)
    }

    if (new_status === 'converted') {
      // TODO: create front_office_audit record, notify ops, start onboarding
      console.log(`[lead-status-changed] Lead ${lead_id} converted → create onboarding workflow`)
    }

    if (new_status === 'lost') {
      // TODO: add to re-engagement list, tag in CRM
      console.log(`[lead-status-changed] Lead ${lead_id} lost → add to re-engagement sequence`)
    }

    return new Response(
      JSON.stringify({ success: true, lead_id, transition: `${old_status}→${new_status}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[lead-status-changed] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
