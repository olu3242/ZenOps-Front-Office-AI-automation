-- Migration: centralized automation brain
-- Depends on: 000004 (tasks table must exist)
-- Apply via: supabase db push  OR  paste into Supabase SQL editor

-- ---------------------------------------------------------------------------
-- 1. automation_rules — stores user-defined if/then rules
-- ---------------------------------------------------------------------------
create table if not exists automation_rules (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid,
  entity_type     text        not null check (entity_type in ('lead', 'task', 'audit')),
  trigger_event   text        not null check (trigger_event in ('status_changed')),

  -- conditions: single object OR array of objects
  -- e.g. {"field":"new_status","operator":"equals","value":"qualified"}
  conditions      jsonb       not null,

  -- actions: array of action objects
  -- e.g. [{"type":"create_task","title":"Call lead"}]
  actions         jsonb       not null,

  is_active       boolean     not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists automation_rules_entity_trigger_idx
  on automation_rules (entity_type, trigger_event) where is_active = true;

alter table automation_rules enable row level security;

create policy "authenticated_all"
  on automation_rules for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2. automation_events — append-only event log
-- ---------------------------------------------------------------------------
create table if not exists automation_events (
  id           uuid        primary key default gen_random_uuid(),
  entity_id    uuid        not null,
  entity_type  text        not null,
  event_type   text        not null,
  payload      jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists automation_events_entity_idx
  on automation_events (entity_id, entity_type, created_at desc);
create index if not exists automation_events_type_idx
  on automation_events (event_type, created_at desc);

alter table automation_events enable row level security;

create policy "authenticated_select"
  on automation_events for select to authenticated using (true);

-- Edge function (service role) can insert via service key — no RLS policy needed
-- for anon/service writes because service role bypasses RLS.

-- ---------------------------------------------------------------------------
-- 3. automation_executions — idempotency + execution audit log
-- ---------------------------------------------------------------------------
create table if not exists automation_executions (
  id            uuid        primary key default gen_random_uuid(),
  event_id      uuid        not null references automation_events(id) on delete cascade,
  rule_id       uuid        not null references automation_rules(id)  on delete cascade,
  status        text        not null default 'running'
                              check (status in ('running', 'success', 'failed', 'skipped')),
  error_detail  text,
  executed_at   timestamptz not null default now(),

  -- Unique guard — prevents the same rule from firing twice for the same event
  unique (event_id, rule_id)
);

create index if not exists automation_executions_event_idx
  on automation_executions (event_id);
create index if not exists automation_executions_rule_idx
  on automation_executions (rule_id, executed_at desc);

alter table automation_executions enable row level security;

create policy "authenticated_select"
  on automation_executions for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 4. Seed: sample automation rules
-- ---------------------------------------------------------------------------
insert into automation_rules (entity_type, trigger_event, conditions, actions) values

  -- Lead reaches qualified → create a call task
  (
    'lead',
    'status_changed',
    '{"field":"new_status","operator":"equals","value":"qualified"}',
    '[{"type":"create_task","title":"Call qualified lead — schedule intro"},{"type":"notify","message":"Lead qualified — action required"}]'
  ),

  -- Lead converted → create onboarding task
  (
    'lead',
    'status_changed',
    '{"field":"new_status","operator":"equals","value":"converted"}',
    '[{"type":"create_task","title":"Kick off client onboarding"},{"type":"notify","message":"Lead converted to client!"}]'
  ),

  -- Audit completed → notify ops team
  (
    'audit',
    'status_changed',
    '{"field":"new_status","operator":"equals","value":"completed"}',
    '[{"type":"notify","message":"Audit completed — prepare and send proposal"},{"type":"create_task","title":"Prepare proposal for audit client"}]'
  ),

  -- Task blocked → escalation notification
  (
    'task',
    'status_changed',
    '{"field":"new_status","operator":"equals","value":"blocked"}',
    '[{"type":"notify","message":"Task blocked — requires immediate attention"}]'
  );
