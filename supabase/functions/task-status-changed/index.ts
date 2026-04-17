import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface TaskStatusPayload {
  task_id: string
  old_status: string
  new_status: string
  changed_by?: string
}

serve(async (req: Request): Promise<Response> => {
  try {
    const payload: TaskStatusPayload = await req.json()
    const { task_id, old_status, new_status, changed_by } = payload

    if (!task_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'task_id and new_status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[task-status-changed] ${task_id}: ${old_status} → ${new_status} (by ${changed_by ?? 'system'})`)

    // -----------------------------------------------------------------------
    // Automation routing
    // -----------------------------------------------------------------------

    if (new_status === 'in_progress') {
      // TODO: start SLA timer, notify assignee
      console.log(`[task-status-changed] Task ${task_id} in_progress → start SLA timer`)
    }

    if (new_status === 'blocked') {
      // TODO: escalate to manager, create unblock sub-task, send alert
      console.log(`[task-status-changed] Task ${task_id} BLOCKED → escalate and notify manager`)
    }

    if (new_status === 'done') {
      // TODO: mark parent workflow step complete, check if all tasks done → advance audit status
      console.log(`[task-status-changed] Task ${task_id} done → mark workflow step complete`)
    }

    return new Response(
      JSON.stringify({ success: true, task_id, transition: `${old_status}→${new_status}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[task-status-changed] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
