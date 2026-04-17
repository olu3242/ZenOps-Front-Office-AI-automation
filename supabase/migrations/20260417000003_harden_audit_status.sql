-- Migration: harden audit status — enum, history, concurrency, automation trigger
-- Apply via: supabase db push  OR  paste into Supabase SQL editor
-- Depends on: 000002 (front_office_audits table must exist)
--
-- One-time operator setup required before edge function calls will fire:
--   alter database postgres set "app.supabase_url"       = 'https://<PROJECT_REF>.supabase.co';
--   alter database postgres set "app.service_role_key"   = '<SERVICE_ROLE_KEY>';

-- ---------------------------------------------------------------------------
-- 0. Enable pg_net (needed for trigger → edge function HTTP calls)
-- ---------------------------------------------------------------------------
create extension if not exists pg_net schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Create audit_status enum (mirrors existing check-constraint values)
-- ---------------------------------------------------------------------------
do $$ begin
  create type audit_status as enum (
    'submitted',
    'scheduled',
    'completed',
    'no_show',
    'proposal_sent',
    'won',
    'lost',
    'not_a_fit'
  );
exception
  when duplicate_object then null;  -- idempotent re-run guard
end $$;

-- ---------------------------------------------------------------------------
-- 2. Migrate front_office_audits.status from text+check → enum
-- ---------------------------------------------------------------------------
-- Drop the inline check constraint (auto-named by PG)
alter table front_office_audits
  drop constraint if exists front_office_audits_status_check;

-- Re-type the column; existing rows cast cleanly because all values are
-- already members of the enum.
alter table front_office_audits
  alter column status type audit_status
  using status::audit_status;

-- Restore typed default
alter table front_office_audits
  alter column status set default 'submitted'::audit_status;

-- ---------------------------------------------------------------------------
-- 3. Audit status history table
-- ---------------------------------------------------------------------------
create table if not exists audit_status_history (
  id          uuid        primary key default gen_random_uuid(),
  audit_id    uuid        not null references front_office_audits(id) on delete cascade,
  old_status  audit_status,                   -- null on first transition
  new_status  audit_status not null,
  changed_by  uuid,                           -- auth.uid() at time of change
  changed_at  timestamptz  not null default now()
);

create index if not exists audit_status_history_audit_id_idx
  on audit_status_history (audit_id, changed_at desc);

alter table audit_status_history enable row level security;

-- Authenticated users can read the history log
create policy "authenticated_select"
  on audit_status_history
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. Trigger function — writes history + fires automation edge function
-- ---------------------------------------------------------------------------
create or replace function log_audit_status_change()
returns trigger language plpgsql security definer as $$
declare
  _url text := current_setting('app.supabase_url', true);
  _key text := current_setting('app.service_role_key', true);
begin
  -- Always write the history row
  insert into audit_status_history (audit_id, old_status, new_status, changed_by)
  values (old.id, old.status, new.status, auth.uid());

  -- Call the automation edge function (async, best-effort — never blocks the update)
  if _url is not null and _url <> '' and _key is not null and _key <> '' then
    perform net.http_post(
      url     := _url || '/functions/v1/audit-status-changed',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body    := jsonb_build_object(
        'audit_id',    new.id::text,
        'old_status',  old.status::text,
        'new_status',  new.status::text,
        'changed_by',  coalesce(auth.uid()::text, '')
      )
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Attach trigger (fires only when status actually changes)
-- ---------------------------------------------------------------------------
drop trigger if exists trg_audit_status_history on front_office_audits;

create trigger trg_audit_status_history
  after update of status on front_office_audits
  for each row
  when (old.status is distinct from new.status)
  execute function log_audit_status_change();
