export type OutreachStatus =
  | 'lead_identified'
  | 'research_complete'
  | 'outreach_sent'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'conversation_started'
  | 'audit_offered'
  | 'audit_booked'
  | 'audit_completed'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'future_follow_up'

export type OutreachCategory =
  | 'hotel'
  | 'restaurant'
  | 'retail'
  | 'healthcare'
  | 'professional_services'
  | 'other'

/**
 * The shape the UI consumes.
 * Mapped from DB rows in the adapter — field names here are UI-stable.
 * New DB fields are added as optional so the page needs no changes.
 */
export interface OutreachRecord {
  // ---- existing fields (UI depends on these) ----
  id: string
  company_name: string       // DB: business_name
  contact_name: string
  contact_title?: string     // DB: contact_role
  contact_email?: string     // DB: email
  category: OutreachCategory
  status: OutreachStatus
  last_activity_date: string // derived from DB: updated_at (YYYY-MM-DD)
  notes?: string
  assigned_to?: string       // not in DB schema yet — kept for compat

  // ---- extended fields from full DB schema ----
  city?: string
  website?: string
  phone?: string
  google_reviews?: number
  google_rating?: number
  has_estimate_form?: boolean
  has_chat_widget?: boolean
  likely_lead_volume?: string
  priority_score?: number
  personalization_note?: string
  outreach_channel?: string
  first_contact_date?: string
  follow_up_1_date?: string
  follow_up_2_date?: string
  follow_up_3_date?: string
  audit_booked?: boolean
  audit_date?: string
  audit_completed?: boolean
  proposal_sent?: boolean
  proposal_date?: string
  closed?: boolean
  outcome?: string
  setup_fee?: number
  monthly_fee?: number
}
