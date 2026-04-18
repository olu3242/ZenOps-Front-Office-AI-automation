/**
 * Outreach data adapter.
 * Exported function signatures are stable — the page needs no changes.
 * All Supabase interaction is isolated here.
 */

import { supabase } from '@/lib/supabase'
import type { OutreachRecord, OutreachCategory, OutreachStatus } from './types'

// ---------------------------------------------------------------------------
// Row type returned by Supabase (mirrors DB columns)
// ---------------------------------------------------------------------------
interface DBRow {
  id: string
  business_name: string
  category: string
  city: string | null
  website: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  contact_role: string | null
  google_reviews: number | null
  google_rating: number | null
  has_estimate_form: boolean | null
  has_chat_widget: boolean | null
  likely_lead_volume: string | null
  priority_score: number | null
  personalization_note: string | null
  outreach_channel: string | null
  first_contact_date: string | null
  follow_up_1_date: string | null
  follow_up_2_date: string | null
  follow_up_3_date: string | null
  status: string
  audit_booked: boolean | null
  audit_date: string | null
  audit_completed: boolean | null
  proposal_sent: boolean | null
  proposal_date: string | null
  closed: boolean | null
  outcome: string | null
  setup_fee: number | null
  monthly_fee: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Map DB row → OutreachRecord (UI shape)
// ---------------------------------------------------------------------------
function mapRow(row: DBRow): OutreachRecord {
  return {
    // existing UI fields
    id: row.id,
    company_name: row.business_name,
    contact_name: row.contact_name ?? '',
    contact_title: row.contact_role ?? undefined,
    contact_email: row.email ?? undefined,
    category: row.category as OutreachCategory,
    status: row.status as OutreachStatus,
    last_activity_date: row.updated_at.split('T')[0],
    notes: row.notes ?? undefined,

    // extended fields
    city: row.city ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    google_reviews: row.google_reviews ?? undefined,
    google_rating: row.google_rating ?? undefined,
    has_estimate_form: row.has_estimate_form ?? undefined,
    has_chat_widget: row.has_chat_widget ?? undefined,
    likely_lead_volume: row.likely_lead_volume ?? undefined,
    priority_score: row.priority_score ?? undefined,
    personalization_note: row.personalization_note ?? undefined,
    outreach_channel: row.outreach_channel ?? undefined,
    first_contact_date: row.first_contact_date ?? undefined,
    follow_up_1_date: row.follow_up_1_date ?? undefined,
    follow_up_2_date: row.follow_up_2_date ?? undefined,
    follow_up_3_date: row.follow_up_3_date ?? undefined,
    audit_booked: row.audit_booked ?? undefined,
    audit_date: row.audit_date ?? undefined,
    audit_completed: row.audit_completed ?? undefined,
    proposal_sent: row.proposal_sent ?? undefined,
    proposal_date: row.proposal_date ?? undefined,
    closed: row.closed ?? undefined,
    outcome: row.outcome ?? undefined,
    setup_fee: row.setup_fee ?? undefined,
    monthly_fee: row.monthly_fee ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface FetchOutreachOptions {
  category?: string
  status?: string
}

export async function fetchOutreachRecords(
  opts: FetchOutreachOptions = {}
): Promise<OutreachRecord[]> {
  let query = supabase
    .from('outreach_records')
    .select('*')
    .order('updated_at', { ascending: false })

  if (opts.category) query = query.eq('category', opts.category)
  if (opts.status) query = query.eq('status', opts.status)

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch outreach records: ${error.message}`)

  return (data as DBRow[]).map(mapRow)
}

export async function updateOutreachStatus(id: string, status: OutreachStatus): Promise<void> {
  const { error } = await supabase
    .from('outreach_records')
    .update({ status })      // updated_at is handled by DB trigger
    .eq('id', id)

  if (error) throw new Error(`Failed to update status: ${error.message}`)
}

export interface ProspectPayload {
  business_name: string
  category: OutreachCategory
  status?: OutreachStatus
  city?: string
  phone?: string
  email?: string
  contact_name?: string
  contact_role?: string
  outreach_channel?: string
  notes?: string
  personalization_note?: string
}

export async function createOutreachRecord(payload: ProspectPayload): Promise<OutreachRecord> {
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined)
  )
  const { data, error } = await supabase
    .from('outreach_records')
    .insert(clean)
    .select()
    .single()
  if (error) throw new Error(`Failed to create record: ${error.message}`)
  return mapRow(data as DBRow)
}

export async function updateOutreachRecord(
  id: string,
  payload: Partial<ProspectPayload>,
): Promise<OutreachRecord> {
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  )
  const { data, error } = await supabase
    .from('outreach_records')
    .update(clean)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update record: ${error.message}`)
  return mapRow(data as DBRow)
}
