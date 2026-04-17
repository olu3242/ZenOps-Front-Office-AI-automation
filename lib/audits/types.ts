export type AuditStatus =
  | 'submitted'
  | 'scheduled'
  | 'completed'
  | 'no_show'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'not_a_fit'

export type AuditRating = 'red' | 'yellow' | 'green'

export type AuditPackage =
  | 'launch_sprint'
  | 'growth_system'
  | 'ai_os'
  | 'not_a_fit'

/** Mirrors front_office_audits DB columns directly — no mapping layer needed */
export interface AuditRecord {
  id: string
  business_name: string
  website: string | null
  industry: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  best_contact_method: string | null
  lead_sources: string | null
  current_lead_flow: string | null
  inbound_owner: string | null
  response_speed: string | null
  missed_call_process: string | null
  post_estimate_process: string | null
  follow_up_owner: string | null
  appointment_reminder_process: string | null
  no_show_process: string | null
  response_visibility: string | null
  avg_response_known: string | null
  what_breaks_if_key_person_missing: string | null
  approximate_customer_value: string | null
  biggest_front_office_frustration: string | null
  audit_score: number | null
  audit_rating: AuditRating | null
  key_revenue_leaks: string | null
  recommended_starting_fix: string | null
  recommended_package: AuditPackage | null
  status: AuditStatus
  created_at: string
  updated_at: string  // required for concurrency-safe updates
}

export interface AuditStatusHistoryEntry {
  id: string
  audit_id: string
  old_status: AuditStatus | null
  new_status: AuditStatus
  changed_by: string | null
  changed_at: string
}
