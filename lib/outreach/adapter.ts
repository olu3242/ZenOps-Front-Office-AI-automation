/**
 * Outreach data adapter.
 * Swap `fetchOutreachRecords` implementation to pull from Supabase when ready.
 * The page consumes only this interface — no changes needed in UI layer.
 */

import type { OutreachRecord } from './types'

// ---------------------------------------------------------------------------
// MOCK DATA — replace with Supabase query when backend is wired
// ---------------------------------------------------------------------------
const MOCK_RECORDS: OutreachRecord[] = [
  {
    id: '1',
    company_name: 'The Grand Hotel',
    contact_name: 'Sarah Patel',
    contact_title: 'GM',
    contact_email: 'sarah@grandhotel.com',
    category: 'hotel',
    status: 'audit_booked',
    last_activity_date: '2026-04-14',
    notes: 'Call booked for April 20',
    assigned_to: 'Alex',
  },
  {
    id: '2',
    company_name: 'Meridian Bistro',
    contact_name: 'James Wu',
    contact_title: 'Owner',
    category: 'restaurant',
    status: 'follow_up_2',
    last_activity_date: '2026-04-10',
    notes: 'No response after first two touches',
    assigned_to: 'Alex',
  },
  {
    id: '3',
    company_name: 'ClearPath Legal',
    contact_name: 'Monica Ross',
    contact_title: 'Operations Director',
    contact_email: 'monica@clearpathlaw.com',
    category: 'professional_services',
    status: 'conversation_started',
    last_activity_date: '2026-04-13',
    notes: 'Interested — needs to check budget',
    assigned_to: 'Alex',
  },
  {
    id: '4',
    company_name: 'Bloom Wellness Clinic',
    contact_name: 'Dr. Reena Sharma',
    contact_title: 'Founder',
    category: 'healthcare',
    status: 'lead_identified',
    last_activity_date: '2026-04-15',
    assigned_to: 'Alex',
  },
  {
    id: '5',
    company_name: 'Oakline Boutique',
    contact_name: 'Tom Fielding',
    contact_title: 'CEO',
    contact_email: 'tom@oakline.co',
    category: 'retail',
    status: 'proposal_sent',
    last_activity_date: '2026-04-09',
    notes: 'Sent proposal deck, awaiting response',
    assigned_to: 'Alex',
  },
  {
    id: '6',
    company_name: 'Harbor View Suites',
    contact_name: 'Carla Diaz',
    contact_title: 'Front Office Manager',
    category: 'hotel',
    status: 'audit_completed',
    last_activity_date: '2026-04-08',
    notes: 'Audit done. Moving to proposal phase.',
    assigned_to: 'Alex',
  },
  {
    id: '7',
    company_name: 'Vertex Consulting',
    contact_name: 'Neil Chen',
    contact_title: 'Partner',
    category: 'professional_services',
    status: 'lost',
    last_activity_date: '2026-03-28',
    notes: 'Chose internal solution',
    assigned_to: 'Alex',
  },
]

export interface FetchOutreachOptions {
  category?: string
  status?: string
}

export async function fetchOutreachRecords(
  opts: FetchOutreachOptions = {}
): Promise<OutreachRecord[]> {
  // TODO: replace with Supabase:
  // const { data, error } = await supabase
  //   .from('outreach_records')
  //   .select('*')
  //   .order('last_activity_date', { ascending: false })
  //   .match({ ...(opts.category ? { category: opts.category } : {}), ... })

  await new Promise((r) => setTimeout(r, 120)) // simulate latency

  let records = [...MOCK_RECORDS]
  if (opts.category) records = records.filter((r) => r.category === opts.category)
  if (opts.status) records = records.filter((r) => r.status === opts.status)
  return records.sort((a, b) => b.last_activity_date.localeCompare(a.last_activity_date))
}
