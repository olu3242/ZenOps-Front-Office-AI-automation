-- Migration: create outreach_records
-- Apply via: supabase db push  OR  paste into Supabase SQL editor

create table if not exists outreach_records (
  id                  uuid primary key default gen_random_uuid(),

  -- Business info
  business_name       text not null,
  category            text not null,
  city                text,
  website             text,
  phone               text,
  email               text,

  -- Contact
  contact_name        text,
  contact_role        text,

  -- Research signals
  google_reviews      integer,
  google_rating       numeric(2,1),
  has_estimate_form   boolean default false,
  has_chat_widget     boolean default false,
  likely_lead_volume  text,            -- e.g. 'High', 'Medium', 'Low'
  priority_score      smallint,        -- 0–100

  -- Outreach activity
  personalization_note text,
  outreach_channel     text,           -- e.g. 'email', 'linkedin', 'phone'
  first_contact_date   date,
  follow_up_1_date     date,
  follow_up_2_date     date,
  follow_up_3_date     date,

  -- Pipeline status
  status              text not null default 'lead_identified'
                        check (status in (
                          'lead_identified', 'research_complete', 'outreach_sent',
                          'follow_up_1', 'follow_up_2', 'follow_up_3',
                          'conversation_started', 'audit_offered', 'audit_booked',
                          'audit_completed', 'proposal_sent', 'negotiation',
                          'won', 'lost', 'future_follow_up'
                        )),

  -- Audit tracking
  audit_booked        boolean default false,
  audit_date          date,
  audit_completed     boolean default false,

  -- Deal tracking
  proposal_sent       boolean default false,
  proposal_date       date,
  closed              boolean default false,
  outcome             text,            -- free text or 'won'/'lost' detail
  setup_fee           numeric(10,2),
  monthly_fee         numeric(10,2),

  -- General
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger outreach_records_updated_at
  before update on outreach_records
  for each row execute function set_updated_at();

-- Indexes for the two filter columns the tracker uses
create index if not exists outreach_records_status_idx   on outreach_records (status);
create index if not exists outreach_records_category_idx on outreach_records (category);

-- Row Level Security
-- TODO: tighten to authenticated users once auth is added.
-- For now, anon key has full access so the tracker can read/write without login.
alter table outreach_records enable row level security;

create policy "allow_all_for_now"
  on outreach_records
  for all
  using (true)
  with check (true);
