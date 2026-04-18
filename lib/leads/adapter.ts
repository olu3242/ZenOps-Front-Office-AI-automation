import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus, LeadStatusHistoryEntry } from './types'
import type { PagedResult } from '@/lib/pagination'
import { PAGE_SIZE } from '@/lib/pagination'

export async function fetchLeadsPaged(opts: {
  limit?: number
  cursor?: string
  search?: string
  status?: string
}): Promise<PagedResult<Lead>> {
  const limit = opts.limit ?? PAGE_SIZE
  let q = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit)
  if (opts.cursor) q = q.lt('created_at', opts.cursor)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.search) {
    const s = `%${opts.search}%`
    q = q.or(`business_name.ilike.${s},contact_name.ilike.${s},email.ilike.${s}`)
  }
  const { data, error } = await q
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  const rows = (data ?? []) as Lead[]
  return { data: rows, nextCursor: rows.length === limit ? rows[rows.length - 1].created_at : null, hasMore: rows.length === limit }
}

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

export async function updateLead(
  id: string,
  payload: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Lead> {
  const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single()
  if (error) throw new Error(`Failed to update lead: ${error.message}`)
  return data as Lead
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete lead: ${error.message}`)
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
