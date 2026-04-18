import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const BATCH_SIZE = 10
const MAX_ATTEMPTS = 3

interface SystemEvent {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  attempts: number
}

interface AutomationRule {
  id: string
  name: string
  entity_type: string
  trigger: string
  conditions: Condition[]
  actions: Action[]
  is_active: boolean
}

interface Condition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'
  value: unknown
}

interface Action {
  type: 'notify' | 'send_email' | 'update_status' | 'create_task'
  payload: Record<string, unknown>
}

function evaluateConditions(conditions: Condition[], payload: Record<string, unknown>): boolean {
  if (!conditions?.length) return true
  return conditions.every(c => {
    const val = payload[c.field]
    switch (c.operator) {
      case 'eq':       return val === c.value
      case 'neq':      return val !== c.value
      case 'gt':       return (val as number) > (c.value as number)
      case 'lt':       return (val as number) < (c.value as number)
      case 'contains': return String(val).toLowerCase().includes(String(c.value).toLowerCase())
      default:         return false
    }
  })
}

async function executeAction(action: Action, event: SystemEvent, ruleId: string): Promise<void> {
  switch (action.type) {
    case 'notify': {
      await supabase.from('automation_events').insert({
        rule_id: ruleId,
        event_type: 'notification',
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: { message: action.payload.message ?? 'Automation triggered', ...action.payload },
      })
      break
    }
    case 'update_status': {
      const table = event.entity_type === 'lead' ? 'leads'
        : event.entity_type === 'task' ? 'tasks'
        : event.entity_type === 'audit' ? 'front_office_audits'
        : null
      if (table && action.payload.status) {
        await supabase.from(table).update({ status: action.payload.status }).eq('id', event.entity_id)
      }
      break
    }
    case 'create_task': {
      await supabase.from('tasks').insert({
        title: action.payload.title ?? 'Follow up',
        description: action.payload.description ?? null,
        due_date: action.payload.due_date ?? null,
        assigned_to: action.payload.assigned_to ?? null,
        related_audit_id: event.entity_type === 'audit' ? event.entity_id : null,
        status: 'todo',
      })
      break
    }
    default:
      break
  }
}

async function processEvent(event: SystemEvent): Promise<void> {
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('entity_type', event.entity_type)
    .eq('trigger', event.event_type)
    .eq('is_active', true)

  if (!rules?.length) return

  for (const rule of rules as AutomationRule[]) {
    if (!evaluateConditions(rule.conditions, event.payload)) continue

    const idempotencyKey = `exec:${rule.id}:${event.id}`
    const { data: existing } = await supabase
      .from('automation_executions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing) continue

    const { data: exec } = await supabase
      .from('automation_executions')
      .insert({ rule_id: rule.id, event_id: event.id, idempotency_key: idempotencyKey, status: 'running' })
      .select('id')
      .single()

    let execError: string | null = null
    try {
      for (const action of rule.actions) {
        await executeAction(action, event, rule.id)
      }
    } catch (err) {
      execError = err instanceof Error ? err.message : String(err)
    }

    await supabase.from('automation_executions').update({
      status: execError ? 'failed' : 'success',
      error: execError,
      completed_at: new Date().toISOString(),
    }).eq('id', exec!.id)
  }
}

Deno.serve(async () => {
  const { data: events, error } = await supabase
    .from('system_events')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at')
    .limit(BATCH_SIZE)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!events?.length) return new Response(JSON.stringify({ processed: 0 }))

  const results = { processed: 0, failed: 0, errors: [] as string[] }

  for (const event of events as SystemEvent[]) {
    await supabase.from('system_events').update({ status: 'processing', attempts: event.attempts + 1 }).eq('id', event.id)

    try {
      await processEvent(event)
      await supabase.from('system_events').update({ status: 'done', processed_at: new Date().toISOString() }).eq('id', event.id)
      results.processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isFinal = event.attempts + 1 >= MAX_ATTEMPTS
      await supabase.from('system_events').update({
        status: isFinal ? 'failed' : 'pending',
        last_error: msg,
      }).eq('id', event.id)
      results.failed++
      results.errors.push(msg)
    }
  }

  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } })
})
