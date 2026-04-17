import { supabase } from '@/lib/supabase'
import type { AutomationRule, AutomationAction, Condition, EntityType, TriggerEvent } from './types'

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function fetchAutomationRules(): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch rules: ${error.message}`)
  return (data ?? []) as AutomationRule[]
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export interface CreateRulePayload {
  entity_type:   EntityType
  trigger_event: TriggerEvent
  conditions:    Condition
  actions:       AutomationAction[]
}

export async function createAutomationRule(
  payload: CreateRulePayload,
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({ ...payload, is_active: true })
    .select()
    .single()
  if (error) throw new Error(`Failed to create rule: ${error.message}`)
  return data as AutomationRule
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateAutomationRule(
  id: string,
  payload: Partial<CreateRulePayload>,
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from('automation_rules')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update rule: ${error.message}`)
  return data as AutomationRule
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------
export async function toggleRuleActive(
  id: string,
  is_active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('automation_rules')
    .update({ is_active })
    .eq('id', id)
  if (error) throw new Error(`Failed to toggle rule: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id)
  if (error) throw new Error(`Failed to delete rule: ${error.message}`)
}
