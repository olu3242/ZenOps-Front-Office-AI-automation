export type EntityType    = 'lead' | 'task' | 'audit'
export type TriggerEvent  = 'status_changed'
export type CondOperator  = 'equals' | 'not_equals' | 'in'
export type ActionType    = 'create_task' | 'notify' | 'update_field'

// ---------------------------------------------------------------------------
// Status value sets (mirrors DB enums — single source of truth for UI)
// ---------------------------------------------------------------------------
export const ENTITY_STATUS_VALUES: Record<EntityType, string[]> = {
  lead:  ['new', 'contacted', 'qualified', 'converted', 'lost'],
  task:  ['todo', 'in_progress', 'blocked', 'done'],
  audit: ['submitted', 'scheduled', 'completed', 'no_show', 'proposal_sent', 'won', 'lost', 'not_a_fit'],
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  lead:  'Lead',
  task:  'Task',
  audit: 'Audit',
}

export const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  status_changed: 'Status Changed',
}

export const OPERATOR_LABELS: Record<CondOperator, string> = {
  equals:     'is',
  not_equals: 'is not',
  in:         'is one of',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  create_task:  'Create Task',
  notify:       'Send Notification',
  update_field: 'Update Field',
}

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------
export interface Condition {
  field:    string    // currently always 'new_status'
  operator: CondOperator
  value:    string    // single value for equals/not_equals; for 'in' store comma-joined string in UI
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export interface CreateTaskAction {
  type:         'create_task'
  title:        string
  description?: string
}

export interface NotifyAction {
  type:    'notify'
  message: string
}

export interface UpdateFieldAction {
  type:  'update_field'
  field: string
  value: string
}

export type AutomationAction = CreateTaskAction | NotifyAction | UpdateFieldAction

// ---------------------------------------------------------------------------
// Rule (matches DB schema exactly)
// ---------------------------------------------------------------------------
export interface AutomationRule {
  id:              string
  organization_id: string | null
  entity_type:     EntityType
  trigger_event:   TriggerEvent
  conditions:      Condition       // single condition (UI enforces this for now)
  actions:         AutomationAction[]
  is_active:       boolean
  created_at:      string
}

// ---------------------------------------------------------------------------
// Summary generators — condition/action → human-readable string
// ---------------------------------------------------------------------------
export function summarizeCondition(rule: AutomationRule): string {
  const { entity_type, conditions: c } = rule
  const entity = ENTITY_LABELS[entity_type]
  const op     = c.operator === 'equals' ? 'becomes' : c.operator === 'not_equals' ? 'is not' : 'is one of'
  return `If ${entity} ${c.field.replace(/_/g, ' ')} ${op} "${c.value}"`
}

export function summarizeActions(actions: AutomationAction[]): string {
  return actions
    .map((a) => {
      if (a.type === 'create_task')  return `Create task: "${a.title}"`
      if (a.type === 'notify')       return `Notify: "${a.message}"`
      if (a.type === 'update_field') return `Set ${a.field} → "${a.value}"`
      return (a as AutomationAction).type
    })
    .join(' • ')
}
