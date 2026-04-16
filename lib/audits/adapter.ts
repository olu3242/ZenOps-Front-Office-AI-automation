/**
 * Audit data adapter.
 * All Supabase interaction for front_office_audits is isolated here.
 */

import { supabase } from '@/lib/supabase'
import type { AuditRecord } from './types'

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
