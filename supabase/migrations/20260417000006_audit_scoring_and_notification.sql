-- Migration: add granular scoring fields + intake email notification trigger
-- Depends on: 000002 (front_office_audits), 000003 (pg_net enabled)

-- ---------------------------------------------------------------------------
-- 1. Add granular per-area score columns
--    (README schema section 4 — these were specced but not in migration 000002)
-- ---------------------------------------------------------------------------
alter table front_office_audits
  add column if not exists score_missed_call        text check (score_missed_call        is null or score_missed_call        in ('red','yellow','green')),
  add column if not exists score_lead_response      text check (score_lead_response      is null or score_lead_response      in ('red','yellow','green')),
  add column if not exists score_estimate_followup  text check (score_estimate_followup  is null or score_estimate_followup  in ('red','yellow','green')),
  add column if not exists score_noshow             text check (score_noshow             is null or score_noshow             in ('red','yellow','green')),
  add column if not exists score_stale_recovery     text check (score_stale_recovery     is null or score_stale_recovery     in ('red','yellow','green')),
  add column if not exists score_pipeline_visibility text check (score_pipeline_visibility is null or score_pipeline_visibility in ('red','yellow','green')),
  add column if not exists top_finding_1            text,
  add column if not exists top_finding_2            text,
  add column if not exists top_finding_3            text,
  add column if not exists auditor_notes            text,
  add column if not exists proposal_sent            boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Notification trigger — fires after every public intake INSERT
-- ---------------------------------------------------------------------------
create or replace function notify_new_audit_intake()
returns trigger language plpgsql security definer as $$
declare
  _url text := current_setting('app.supabase_url', true);
  _key text := current_setting('app.service_role_key', true);
begin
  if _url is not null and _url <> '' and _key is not null and _key <> '' then
    perform net.http_post(
      url     := _url || '/functions/v1/notify-new-audit-intake',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body    := jsonb_build_object(
        'id',                               new.id::text,
        'business_name',                    new.business_name,
        'contact_name',                     coalesce(new.contact_name, ''),
        'email',                            coalesce(new.email, ''),
        'phone',                            coalesce(new.phone, ''),
        'industry',                         coalesce(new.industry, ''),
        'biggest_front_office_frustration', coalesce(new.biggest_front_office_frustration, ''),
        'approximate_customer_value',       coalesce(new.approximate_customer_value, ''),
        'current_lead_flow',                coalesce(new.current_lead_flow, ''),
        'created_at',                       new.created_at::text
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_audit_intake on front_office_audits;

create trigger trg_notify_new_audit_intake
  after insert on front_office_audits
  for each row
  execute function notify_new_audit_intake();
