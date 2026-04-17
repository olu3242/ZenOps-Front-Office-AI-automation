'use client'

import { useState, useCallback } from 'react'
import type {
  EntityType,
  TriggerEvent,
  CondOperator,
  ActionType,
  Condition,
  AutomationAction,
  CreateTaskAction,
  NotifyAction,
  UpdateFieldAction,
} from '@/lib/automation/types'
import {
  ENTITY_LABELS,
  ENTITY_STATUS_VALUES,
  TRIGGER_LABELS,
  OPERATOR_LABELS,
  ACTION_LABELS,
} from '@/lib/automation/types'
import type { CreateRulePayload } from '@/lib/automation/adapter'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RuleBuilderProps {
  /** Pass an initial rule to pre-fill in edit mode */
  initial?: Partial<{
    entity_type:   EntityType
    trigger_event: TriggerEvent
    conditions:    Condition
    actions:       AutomationAction[]
  }>
  saving: boolean
  onSave: (payload: CreateRulePayload) => Promise<void>
  onClose: () => void
}

interface ActionDraft {
  draftId: string  // local key only — not stored in DB
  type: ActionType
  title:       string   // create_task
  description: string   // create_task
  message:     string   // notify
  field:       string   // update_field
  value:       string   // update_field
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ENTITY_TYPES: EntityType[]    = ['lead', 'task', 'audit']
const TRIGGER_EVENTS: TriggerEvent[] = ['status_changed']
const COND_OPERATORS: CondOperator[] = ['equals', 'not_equals', 'in']
const ACTION_TYPES: ActionType[]     = ['create_task', 'notify', 'update_field']

const BLANK_ACTION = (): ActionDraft => ({
  draftId:     crypto.randomUUID(),
  type:        'create_task',
  title:       '',
  description: '',
  message:     '',
  field:       '',
  value:       '',
})

// ---------------------------------------------------------------------------
// Serialise draft actions → AutomationAction[]
// ---------------------------------------------------------------------------
function serialiseAction(d: ActionDraft): AutomationAction | null {
  switch (d.type) {
    case 'create_task':
      if (!d.title.trim()) return null
      return { type: 'create_task', title: d.title.trim(), description: d.description.trim() || undefined } satisfies CreateTaskAction
    case 'notify':
      if (!d.message.trim()) return null
      return { type: 'notify', message: d.message.trim() } satisfies NotifyAction
    case 'update_field':
      if (!d.field.trim() || !d.value.trim()) return null
      return { type: 'update_field', field: d.field.trim(), value: d.value.trim() } satisfies UpdateFieldAction
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
interface FormErrors {
  entity_type?:   string
  cond_value?:    string
  actions?:       string
  action?:        Record<string, string>
}

function validate(
  entityType: EntityType | '',
  condition: { operator: CondOperator; value: string },
  actions: ActionDraft[],
): FormErrors {
  const errors: FormErrors = {}
  if (!entityType) errors.entity_type = 'Select an entity type'
  if (!condition.value.trim()) errors.cond_value = 'Choose a value'
  if (actions.length === 0) {
    errors.actions = 'Add at least one action'
  } else {
    const actionErrors: Record<string, string> = {}
    actions.forEach((a) => {
      if (a.type === 'create_task' && !a.title.trim())
        actionErrors[a.draftId] = 'Title is required'
      if (a.type === 'notify' && !a.message.trim())
        actionErrors[a.draftId] = 'Message is required'
      if (a.type === 'update_field' && (!a.field.trim() || !a.value.trim()))
        actionErrors[a.draftId] = 'Field and Value are required'
    })
    if (Object.keys(actionErrors).length) errors.action = actionErrors
  }
  return errors
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RuleBuilder({ initial, saving, onSave, onClose }: RuleBuilderProps) {
  const [entityType, setEntityType]   = useState<EntityType | ''>(initial?.entity_type ?? '')
  const [trigger]                     = useState<TriggerEvent>('status_changed')
  const [condOperator, setCondOp]     = useState<CondOperator>(initial?.conditions?.operator ?? 'equals')
  const [condValue, setCondValue]     = useState(initial?.conditions?.value ?? '')
  const [actions, setActions]         = useState<ActionDraft[]>(
    initial?.actions?.map((a) => {
      const d = BLANK_ACTION()
      d.type = a.type
      if (a.type === 'create_task') { d.title = a.title; d.description = a.description ?? '' }
      if (a.type === 'notify')       d.message = a.message
      if (a.type === 'update_field') { d.field = a.field; d.value = a.value }
      return d
    }) ?? [BLANK_ACTION()]
  )
  const [errors, setErrors] = useState<FormErrors>({})

  const statusOptions = entityType ? ENTITY_STATUS_VALUES[entityType] : []

  // ---- Action helpers ----
  const addAction = useCallback(() => setActions((prev) => [...prev, BLANK_ACTION()]), [])
  const removeAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.draftId !== id))
  }, [])
  const patchAction = useCallback((id: string, patch: Partial<ActionDraft>) => {
    setActions((prev) => prev.map((a) => a.draftId === id ? { ...a, ...patch } : a))
  }, [])

  // ---- Submit ----
  const handleSubmit = useCallback(async () => {
    const errs = validate(entityType, { operator: condOperator, value: condValue }, actions)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const serialised = actions.map(serialiseAction).filter((a): a is AutomationAction => a !== null)

    await onSave({
      entity_type:   entityType as EntityType,
      trigger_event: trigger,
      conditions: {
        field:    'new_status',
        operator: condOperator,
        value:    condValue,
      },
      actions: serialised,
    })
  }, [entityType, trigger, condOperator, condValue, actions, onSave])

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Edit Rule' : 'New Automation Rule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ---- Entity + Trigger ---- */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              When this happens
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Entity</label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as EntityType)
                    setCondValue('') // reset value when entity changes
                  }}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.entity_type ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select entity…</option>
                  {ENTITY_TYPES.map((e) => (
                    <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
                  ))}
                </select>
                {errors.entity_type && (
                  <p className="text-xs text-red-500 mt-1">{errors.entity_type}</p>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Trigger</label>
                <select
                  value={trigger}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600"
                >
                  {TRIGGER_EVENTS.map((t) => (
                    <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ---- Condition ---- */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Condition
            </label>
            <div className="flex gap-2 items-start">
              {/* Field (fixed for now) */}
              <div className="w-28 shrink-0">
                <input
                  readOnly
                  value="Status"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                />
              </div>

              {/* Operator */}
              <select
                value={condOperator}
                onChange={(e) => setCondOp(e.target.value as CondOperator)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COND_OPERATORS.map((op) => (
                  <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                ))}
              </select>

              {/* Value */}
              <div className="flex-1">
                <select
                  value={condValue}
                  onChange={(e) => setCondValue(e.target.value)}
                  disabled={!entityType}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cond_value ? 'border-red-400' : 'border-gray-300'} disabled:bg-gray-50 disabled:text-gray-400`}
                >
                  <option value="">
                    {entityType ? 'Select status…' : 'Select entity first'}
                  </option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {errors.cond_value && (
                  <p className="text-xs text-red-500 mt-1">{errors.cond_value}</p>
                )}
              </div>
            </div>
            {entityType && condValue && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                If <strong>{ENTITY_LABELS[entityType]}</strong> status{' '}
                {OPERATOR_LABELS[condOperator]} "<strong>{condValue.replace(/_/g, ' ')}</strong>"
              </p>
            )}
          </section>

          {/* ---- Actions ---- */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </label>
              <button
                onClick={addAction}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add action
              </button>
            </div>

            {errors.actions && (
              <p className="text-xs text-red-500 mb-2">{errors.actions}</p>
            )}

            <div className="space-y-3">
              {actions.map((a) => (
                <ActionRow
                  key={a.draftId}
                  draft={a}
                  error={errors.action?.[a.draftId]}
                  showRemove={actions.length > 1}
                  entityType={entityType || undefined}
                  onPatch={(patch) => patchAction(a.draftId, patch)}
                  onRemove={() => removeAction(a.draftId)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm bg-gray-900 text-white rounded-md px-4 py-2 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {saving ? 'Saving…' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action row sub-component
// ---------------------------------------------------------------------------
interface ActionRowProps {
  draft:      ActionDraft
  error?:     string
  showRemove: boolean
  entityType?: EntityType
  onPatch:    (patch: Partial<ActionDraft>) => void
  onRemove:   () => void
}

function ActionRow({ draft: a, error, showRemove, onPatch, onRemove }: ActionRowProps) {
  return (
    <div className={`border rounded-lg p-3 space-y-2.5 ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <select
          value={a.type}
          onChange={(e) => onPatch({ type: e.target.value as ActionType })}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t} value={t}>{ACTION_LABELS[t]}</option>
          ))}
        </select>
        {showRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {a.type === 'create_task' && (
        <>
          <input
            type="text"
            placeholder="Task title *"
            value={a.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={a.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </>
      )}

      {a.type === 'notify' && (
        <input
          type="text"
          placeholder="Notification message *"
          value={a.message}
          onChange={(e) => onPatch({ message: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      )}

      {a.type === 'update_field' && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Field name *"
            value={a.field}
            onChange={(e) => onPatch({ field: e.target.value })}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Value *"
            value={a.value}
            onChange={(e) => onPatch({ value: e.target.value })}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
