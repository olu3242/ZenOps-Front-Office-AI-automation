-- Migration: create front_office_audits
-- Apply via: supabase db push  OR  paste into Supabase SQL editor
-- Depends on: 000000 (set_updated_at function must already exist)

create table if not exists front_office_audits (
  id                                uuid primary key default gen_random_uuid(),

  -- Business info (from intake form)
  business_name                     text not null,
  website                           text,
  industry                          text,

  -- Contact
  contact_name                      text,
  email                             text,
  phone                             text,
  best_contact_method               text,   -- 'email' | 'phone' | 'text'

  -- Front office assessment (intake form answers)
  lead_sources                      text,
  current_lead_flow                 text,
  inbound_owner                     text,
  response_speed                    text,
  missed_call_process               text,
  post_estimate_process             text,
  follow_up_owner                   text,
  appointment_reminder_process      text,
  no_show_process                   text,
  response_visibility               text,
  avg_response_known                text,
  what_breaks_if_key_person_missing text,
  approximate_customer_value        text,
  biggest_front_office_frustration  text,

  -- Internal audit results (filled post-call by ops team)
  audit_score               integer,
  audit_rating              text
                              check (audit_rating is null or audit_rating in ('red', 'yellow', 'green')),
  key_revenue_leaks         text,
  recommended_starting_fix  text,
  recommended_package       text
                              check (recommended_package is null or recommended_package in (
                                'launch_sprint', 'growth_system', 'ai_os', 'not_a_fit'
                              )),

  -- Pipeline status
  status                    text not null default 'submitted'
                              check (status in (
                                'submitted', 'scheduled', 'completed', 'no_show',
                                'proposal_sent', 'won', 'lost', 'not_a_fit'
                              )),

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Reuse set_updated_at() defined in migration 000000
create trigger front_office_audits_updated_at
  before update on front_office_audits
  for each row execute function set_updated_at();

-- Indexes for list queries
create index if not exists front_office_audits_status_idx
  on front_office_audits (status);
create index if not exists front_office_audits_created_at_idx
  on front_office_audits (created_at desc);

-- Row Level Security
alter table front_office_audits enable row level security;

-- Public intake form can INSERT (anon and authenticated both allowed)
create policy "public_audit_insert"
  on front_office_audits
  for insert
  with check (true);

-- Authenticated users can read all submissions
create policy "authenticated_select"
  on front_office_audits
  for select
  to authenticated
  using (true);

-- Authenticated users can update (scoring, status changes after audit call)
create policy "authenticated_update"
  on front_office_audits
  for update
  to authenticated
  using (true)
  with check (true);
