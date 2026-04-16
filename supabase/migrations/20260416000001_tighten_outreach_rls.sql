-- Migration: tighten outreach_records RLS to authenticated users only
-- Apply via: supabase db push  OR  paste into Supabase SQL editor

-- Remove the permissive placeholder policy from migration 000000
drop policy if exists "allow_all_for_now" on outreach_records;

-- SELECT: authenticated users only
create policy "authenticated_select"
  on outreach_records
  for select
  using (auth.role() = 'authenticated');

-- UPDATE: authenticated users only (covers inline status changes from tracker)
create policy "authenticated_update"
  on outreach_records
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- INSERT: authenticated users only (needed when adding new prospects)
create policy "authenticated_insert"
  on outreach_records
  for insert
  with check (auth.role() = 'authenticated');

-- NOTE: DELETE is intentionally omitted. Add when/if a delete flow is built.
-- NOTE: When multi-user/team isolation is needed, replace auth.role() checks
--       with auth.uid() = owner_id or a team membership join.
