/**
 * Audit data adapter.
 * All Supabase interaction for front_office_audits is isolated here.
 */

import { supabase } from '@/lib/supabase'
import type { AuditRecord, AuditRating, AuditPackage, AuditStatus, AuditStatusHistoryEntry } from './types'

export interface AuditResultsPayload {
  score_missed_call?: AuditRating | null
  score_lead_response?: AuditRating | null
  score_estimate_followup?: AuditRating | null
  score_noshow?: AuditRating | null
  score_stale_recovery?: AuditRating | null
  score_pipeline_visibility?: AuditRating | null
  top_finding_1?: string | null
  top_finding_2?: string | null
  top_finding_3?: string | null
  auditor_notes?: string | null
  recommended_package?: AuditPackage | null
  proposal_sent?: boolean
}

export async function submitAuditRequest(data: Record<string, string>): Promise<void> {
  // Strip empty strings so optional fields store null, not empty string
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '')
  )
  const { error } = await supabase
    .from('front_office_audits')
    .insert(payload)
  if (error) throw new Error(`Failed to submit audit request: ${error.message}`)
}

export async function fetchAuditRecords(): Promise<AuditRecord[]> {
  const { data, error } = await supabase
    .from('front_office_audits')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch audit records: ${error.message}`)
  return (data ?? []) as AuditRecord[]
}

/**
 * Concurrency-safe status update.
 *
 * The update is conditional on `updatedAt` matching the DB row's current
 * updated_at.  If another user updated the row in the meantime, Supabase
 * returns 0 rows and we throw CONCURRENCY_CONFLICT so the caller can
 * surface the right toast message and roll back the optimistic change.
 *
 * @returns The full updated record (with refreshed updated_at) so the
 *          caller can sync local state for the next save.
 */
export async function updateAuditStatus(
  id: string,
  status: AuditStatus,
  updatedAt: string,
): Promise<AuditRecord> {
  const { data, error } = await supabase
    .from('front_office_audits')
    .update({ status })
    .eq('id', id)
    .eq('updated_at', updatedAt)
    .select()

  if (error) throw new Error(`Failed to update audit status: ${error.message}`)
  if (!data || data.length === 0) throw new Error('CONCURRENCY_CONFLICT')

  return data[0] as AuditRecord
}

export async function updateAuditResults(
  id: string,
  payload: AuditResultsPayload,
): Promise<AuditRecord> {
  const { data, error } = await supabase
    .from('front_office_audits')
    .update(payload)
    .eq('id', id)
    .select()
  if (error) throw new Error(`Failed to update audit results: ${error.message}`)
  if (!data || data.length === 0) throw new Error('Record not found')
  return data[0] as AuditRecord
}

export async function fetchAuditStatusHistory(
  auditId: string,
): Promise<AuditStatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from('audit_status_history')
    .select('*')
    .eq('audit_id', auditId)
    .order('changed_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch audit history: ${error.message}`)
  return (data ?? []) as AuditStatusHistoryEntry[]
}
