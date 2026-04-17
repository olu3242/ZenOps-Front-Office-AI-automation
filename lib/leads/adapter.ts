import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus, LeadStatusHistoryEntry } from './types'

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  return (data ?? []) as Lead[]
}

/**
 * Concurrency-safe status update — matches the audit pattern exactly.
 * Throws 'CONCURRENCY_CONFLICT' if updated_at no longer matches.
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  updatedAt: string,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .eq('updated_at', updatedAt)
    .select()

  if (error) throw new Error(`Failed to update lead status: ${error.message}`)
  if (!data || data.length === 0) throw new Error('CONCURRENCY_CONFLICT')

  return data[0] as Lead
}

export async function createLead(
  payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'>,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(`Failed to create lead: ${error.message}`)
  return data as Lead
}

export async function fetchLeadStatusHistory(
  leadId: string,
): Promise<LeadStatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from('lead_status_history')
    .select('*')
    .eq('lead_id', leadId)
    .order('changed_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch lead history: ${error.message}`)
  return (data ?? []) as LeadStatusHistoryEntry[]
}
