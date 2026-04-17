import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface AuditStatusPayload {
  audit_id: string
  old_status: string
  new_status: string
  changed_by?: string
}

serve(async (req: Request): Promise<Response> => {
  try {
    const payload: AuditStatusPayload = await req.json()
    const { audit_id, old_status, new_status, changed_by } = payload

    if (!audit_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'audit_id and new_status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[audit-status-changed] ${audit_id}: ${old_status} → ${new_status} (by ${changed_by ?? 'system'})`)

    // -----------------------------------------------------------------------
    // Automation routing — extend each branch with real workflow calls
    // -----------------------------------------------------------------------

    if (new_status === 'scheduled') {
      // TODO: send calendar invite / confirmation email to client
      console.log(`[audit-status-changed] Audit ${audit_id} scheduled → send confirmation`)
    }

    if (new_status === 'completed') {
      // TODO: trigger proposal generation workflow
      // TODO: update CRM record
      console.log(`[audit-status-changed] Audit ${audit_id} completed → trigger proposal pipeline`)
    }

    if (new_status === 'no_show') {
      // TODO: create follow-up task, decrement SLA counter
      console.log(`[audit-status-changed] Audit ${audit_id} no-show → create follow-up task`)
    }

    if (new_status === 'proposal_sent') {
      // TODO: start proposal follow-up sequence
      console.log(`[audit-status-changed] Audit ${audit_id} proposal sent → start follow-up sequence`)
    }

    if (new_status === 'won') {
      // TODO: trigger onboarding workflow, create tasks, notify team
      console.log(`[audit-status-changed] Audit ${audit_id} WON → trigger onboarding`)
    }

    if (new_status === 'lost' || new_status === 'not_a_fit') {
      // TODO: move to nurture sequence, tag in CRM
      console.log(`[audit-status-changed] Audit ${audit_id} ${new_status} → add to nurture list`)
    }

    return new Response(
      JSON.stringify({ success: true, audit_id, transition: `${old_status}→${new_status}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[audit-status-changed] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
