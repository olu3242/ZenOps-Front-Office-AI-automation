export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'

export interface Lead {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LeadStatusHistoryEntry {
  id: string
  lead_id: string
  old_status: LeadStatus | null
  new_status: LeadStatus
  changed_by: string | null
  changed_at: string
}
