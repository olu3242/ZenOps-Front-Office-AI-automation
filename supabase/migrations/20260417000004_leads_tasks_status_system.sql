-- Migration: leads + tasks tables with enum status, history tracking, and automation triggers
-- Apply via: supabase db push  OR  paste into Supabase SQL editor
-- Depends on: 000000 (set_updated_at), 000003 (pg_net already enabled)
-- Requires same app.supabase_url / app.service_role_key settings as 000003.

-- ===========================================================================
-- LEADS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. lead_status enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type lead_status as enum (
    'new',
    'contacted',
    'qualified',
    'converted',
    'lost'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. leads table
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id            uuid        primary key default gen_random_uuid(),
  business_name text        not null,
  contact_name  text,
  email         text,
  phone         text,
  source        text,       -- 'website' | 'referral' | 'cold_outreach' | ...
  status        lead_status not null default 'new',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

create index if not exists leads_status_idx     on leads (status);
create index if not exists leads_created_at_idx on leads (created_at desc);

alter table leads enable row level security;

create policy "authenticated_select"
  on leads for select to authenticated using (true);
create policy "authenticated_insert"
  on leads for insert to authenticated with check (true);
create policy "authenticated_update"
  on leads for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3. lead_status_history table
-- ---------------------------------------------------------------------------
create table if not exists lead_status_history (
  id          uuid        primary key default gen_random_uuid(),
  lead_id     uuid        not null references leads(id) on delete cascade,
  old_status  lead_status,
  new_status  lead_status not null,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);

create index if not exists lead_status_history_lead_id_idx
  on lead_status_history (lead_id, changed_at desc);

alter table lead_status_history enable row level security;

create policy "authenticated_select"
  on lead_status_history for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 4. Trigger function for leads
-- ---------------------------------------------------------------------------
create or replace function log_lead_status_change()
returns trigger language plpgsql security definer as $$
declare
  _url text := current_setting('app.supabase_url', true);
  _key text := current_setting('app.service_role_key', true);
begin
  insert into lead_status_history (lead_id, old_status, new_status, changed_by)
  values (old.id, old.status, new.status, auth.uid());

  if _url is not null and _url <> '' and _key is not null and _key <> '' then
    perform net.http_post(
      url     := _url || '/functions/v1/lead-status-changed',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body    := jsonb_build_object(
        'lead_id',    new.id::text,
        'old_status', old.status::text,
        'new_status', new.status::text,
        'changed_by', coalesce(auth.uid()::text, '')
      )
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Attach leads trigger
-- ---------------------------------------------------------------------------
drop trigger if exists trg_lead_status_history on leads;

create trigger trg_lead_status_history
  after update of status on leads
  for each row
  when (old.status is distinct from new.status)
  execute function log_lead_status_change();


-- ===========================================================================
-- TASKS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 6. task_status enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type task_status as enum (
    'todo',
    'in_progress',
    'blocked',
    'done'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 7. tasks table
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text,
  due_date         date,
  assigned_to      uuid,       -- references auth.users(id) — FK omitted for portability
  related_audit_id uuid        references front_office_audits(id) on delete set null,
  status           task_status not null default 'todo',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create index if not exists tasks_status_idx          on tasks (status);
create index if not exists tasks_assigned_to_idx     on tasks (assigned_to);
create index if not exists tasks_related_audit_idx   on tasks (related_audit_id);

alter table tasks enable row level security;

create policy "authenticated_select"
  on tasks for select to authenticated using (true);
create policy "authenticated_insert"
  on tasks for insert to authenticated with check (true);
create policy "authenticated_update"
  on tasks for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 8. task_status_history table
-- ---------------------------------------------------------------------------
create table if not exists task_status_history (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references tasks(id) on delete cascade,
  old_status  task_status,
  new_status  task_status not null,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);

create index if not exists task_status_history_task_id_idx
  on task_status_history (task_id, changed_at desc);

alter table task_status_history enable row level security;

create policy "authenticated_select"
  on task_status_history for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 9. Trigger function for tasks
-- ---------------------------------------------------------------------------
create or replace function log_task_status_change()
returns trigger language plpgsql security definer as $$
declare
  _url text := current_setting('app.supabase_url', true);
  _key text := current_setting('app.service_role_key', true);
begin
  insert into task_status_history (task_id, old_status, new_status, changed_by)
  values (old.id, old.status, new.status, auth.uid());

  if _url is not null and _url <> '' and _key is not null and _key <> '' then
    perform net.http_post(
      url     := _url || '/functions/v1/task-status-changed',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body    := jsonb_build_object(
        'task_id',    new.id::text,
        'old_status', old.status::text,
        'new_status', new.status::text,
        'changed_by', coalesce(auth.uid()::text, '')
      )
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Attach tasks trigger
-- ---------------------------------------------------------------------------
drop trigger if exists trg_task_status_history on tasks;

create trigger trg_task_status_history
  after update of status on tasks
  for each row
  when (old.status is distinct from new.status)
  execute function log_task_status_change();
