/**
 * process-automation-event — ZenOps Automation Brain
 *
 * Receives a normalised event, evaluates all matching active rules,
 * executes their actions, and writes an idempotent execution record.
 *
 * Execution flow:
 *   Incoming event
 *     → log to automation_events
 *     → fetch active rules for (entity_type, trigger_event)
 *     → for each rule:
 *         evaluate conditions against payload (AND logic)
 *         claim execution slot atomically (unique(event_id, rule_id))
 *         execute actions sequentially
 *         update execution status to success | failed
 */

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS for writes)
// ---------------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EntityType    = 'lead' | 'task' | 'audit'
type CondOperator  = 'equals' | 'not_equals' | 'contains' | 'in'
type ActionType    = 'create_task' | 'notify' | 'update_field'

interface Condition {
  field:    string
  operator: CondOperator
  value:    unknown
}

interface AutomationAction {
  type: ActionType
  [key: string]: unknown
}

interface AutomationRule {
  id:           string
  entity_type:  EntityType
  trigger_event: string
  conditions:   Condition | Condition[]
  actions:      AutomationAction[]
  is_active:    boolean
}

interface EventPayload {
  entity_id:   string
  entity_type: EntityType
  event_type:  string
  payload:     Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
serve(async (req: Request): Promise<Response> => {
  try {
    const body: EventPayload = await req.json()
    const { entity_id, entity_type, event_type, payload } = body

    if (!entity_id || !entity_type || !event_type) {
      return jsonResponse({ error: 'entity_id, entity_type, and event_type are required' }, 400)
    }

    // 1. Log the incoming event
    const { data: eventRow, error: eventErr } = await db
      .from('automation_events')
      .insert({ entity_id, entity_type, event_type, payload })
      .select('id')
      .single()

    if (eventErr) throw new Error(`Failed to log event: ${eventErr.message}`)
    const event_id: string = eventRow.id

    // 2. Fetch matching active rules
    const { data: rules, error: rulesErr } = await db
      .from('automation_rules')
      .select('*')
      .eq('entity_type', entity_type)
      .eq('trigger_event', event_type)
      .eq('is_active', true)

    if (rulesErr) throw new Error(`Failed to fetch rules: ${rulesErr.message}`)

    const context = { entity_id, entity_type, ...payload }
    const results: Record<string, unknown>[] = []

    for (const rule of (rules ?? []) as AutomationRule[]) {

      // 3. Evaluate conditions (AND logic — all must pass)
      if (!evaluateConditions(rule.conditions, payload)) {
        results.push({ rule_id: rule.id, skipped: 'condition_not_met' })
        continue
      }

      // 4. Atomically claim execution slot (unique constraint is the guard)
      //    If another invocation already claimed it we get error code 23505.
      const { data: execRow, error: claimErr } = await db
        .from('automation_executions')
        .insert({ event_id, rule_id: rule.id, status: 'running' })
        .select('id')
        .single()

      if (claimErr) {
        if (claimErr.code === '23505') {
          results.push({ rule_id: rule.id, skipped: 'already_executed' })
          continue
        }
        throw new Error(`Failed to claim execution: ${claimErr.message}`)
      }

      // 5. Execute actions and update execution record
      try {
        await executeActions(rule.actions, context)

        await db
          .from('automation_executions')
          .update({ status: 'success' })
          .eq('id', execRow.id)

        results.push({ rule_id: rule.id, status: 'success' })
        console.log(`[automation] rule ${rule.id} → success (event ${event_id})`)

      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)

        await db
          .from('automation_executions')
          .update({ status: 'failed', error_detail: detail })
          .eq('id', execRow.id)

        results.push({ rule_id: rule.id, status: 'failed', error: detail })
        console.error(`[automation] rule ${rule.id} → failed:`, detail)
      }
    }

    return jsonResponse({ success: true, event_id, results })

  } catch (err) {
    console.error('[process-automation-event] fatal:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})

// ---------------------------------------------------------------------------
// Condition engine
// ---------------------------------------------------------------------------
function evaluateConditions(
  conditions: Condition | Condition[],
  payload: Record<string, unknown>,
): boolean {
  const list = Array.isArray(conditions) ? conditions : [conditions]
  return list.every((c) => evaluateCondition(c, payload))
}

function evaluateCondition(c: Condition, payload: Record<string, unknown>): boolean {
  const actual = payload[c.field]
  switch (c.operator) {
    case 'equals':     return actual === c.value
    case 'not_equals': return actual !== c.value
    case 'contains':   return typeof actual === 'string' && actual.includes(String(c.value))
    case 'in':         return Array.isArray(c.value) && (c.value as unknown[]).includes(actual)
    default:           return false
  }
}

// ---------------------------------------------------------------------------
// Action engine
// ---------------------------------------------------------------------------
async function executeActions(
  actions: AutomationAction[],
  ctx: Record<string, unknown>,
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {

      case 'create_task': {
        const { error } = await db.from('tasks').insert({
          title:           String(action.title ?? 'Automated task'),
          description:     action.description ? String(action.description) : null,
          related_audit_id: ctx.entity_type === 'audit' ? String(ctx.entity_id) : null,
          status:          'todo',
        })
        if (error) throw new Error(`create_task failed: ${error.message}`)
        console.log(`[automation/action] created task: ${action.title}`)
        break
      }

      case 'notify': {
        // Log as a notification event — callers can poll this table or subscribe via Realtime
        const { error } = await db.from('automation_events').insert({
          entity_id:   String(ctx.entity_id),
          entity_type: String(ctx.entity_type),
          event_type:  'notification',
          payload:     { message: String(action.message ?? ''), context: ctx },
        })
        if (error) throw new Error(`notify failed: ${error.message}`)
        console.log(`[automation/action] notification: ${action.message}`)
        break
      }

      case 'update_field': {
        const table = entityTable(String(ctx.entity_type))
        if (!table) throw new Error(`update_field: unknown entity_type ${ctx.entity_type}`)
        if (!action.field)  throw new Error('update_field: field is required')

        const { error } = await db
          .from(table)
          .update({ [String(action.field)]: action.value })
          .eq('id', String(ctx.entity_id))
        if (error) throw new Error(`update_field failed: ${error.message}`)
        console.log(`[automation/action] updated ${table}.${action.field} = ${action.value}`)
        break
      }

      default:
        console.warn(`[automation/action] unknown action type: ${(action as AutomationAction).type}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function entityTable(entityType: string): string | null {
  const map: Record<string, string> = {
    lead:  'leads',
    task:  'tasks',
    audit: 'front_office_audits',
  }
  return map[entityType] ?? null
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
