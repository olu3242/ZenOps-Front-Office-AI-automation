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

export interface OutreachRecord {
  id: string
  company_name: string
  contact_name: string
  contact_title?: string
  contact_email?: string
  category: OutreachCategory
  status: OutreachStatus
  last_activity_date: string // ISO date string
  notes?: string
  assigned_to?: string
}
