1. IMPLEMENTATION SUMMARY
Build 5 focused routes on top of the existing ZenOps codebase. No redesign. Reuse existing layout shell, nav, and UI patterns. All new routes are self-contained. DB changes are additive only — two new Supabase tables.
Build time estimate: 1–2 focused sessions in Claude Code.

2. FILES / FOLDERS CHANGED
src/
  pages/
    audit/
      index.tsx          ← /audit        (landing page)
      book.tsx           ← /audit/book   (Calendly embed or booking form)
      request.tsx        ← /audit/request (intake form)
    ops/
      outreach.tsx       ← /ops/outreach  (mini CRM / prospect tracker)
      audits.tsx         ← /ops/audits    (audit management view)

  components/
    audit/
      AuditHero.tsx
      AuditDiagnosticGrid.tsx
      AuditWhatYouGet.tsx
      AuditCTABlock.tsx
      AuditIntakeForm.tsx
    ops/
      OutreachTable.tsx
      AuditSummaryCard.tsx
      ProspectDrawer.tsx

  lib/
    supabase/
      outbound-prospects.ts   ← typed queries
      front-office-audits.ts  ← typed queries

supabase/
  migrations/
    0001_add_outbound_prospects.sql
    0002_add_front_office_audits.sql

3. ROUTES ADDED
RoutePurposeAuth/auditPublic landing page — Front Office Audit offerPublic/audit/bookBooking page — embed Calendly or native formPublic/audit/requestIntake form — prospect submits pre-call infoPublic/ops/outreachInternal — outreach prospect trackerProtected/ops/auditsInternal — manage booked/completed auditsProtected

4. SCHEMA / MIGRATIONS
Table: outbound_prospects
sqlcreate table outbound_prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Contact
  first_name text,
  last_name text,
  business_name text not null,
  trade_type text,          -- 'hvac' | 'roofing' | 'plumbing' | 'electrical' | 'landscaping' | 'other'
  city text,
  phone text,
  email text,

  -- Pipeline
  lead_source text,
  status text default 'new',
  -- 'new' | 'contacted' | 'audit_requested' | 'audit_scheduled' |
  -- 'audit_completed' | 'proposal_sent' | 'closed_won' | 'closed_lost' | 'not_a_fit'

  last_contact_date date,
  next_action text,
  next_action_date date,
  assigned_to text,
  notes text
);

Table: front_office_audits
sqlcreate table front_office_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Link
  prospect_id uuid references outbound_prospects(id),

  -- Identity
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  trade_type text,
  city text,

  -- Scheduling
  audit_date date,
  call_status text default 'form_submitted',
  -- 'form_submitted' | 'call_scheduled' | 'call_completed' | 'no_show' | 'rescheduled' | 'cancelled'

  -- Intake form responses (from /audit/request)
  team_size text,
  monthly_leads text,
  current_crm text,
  biggest_problem text,
  intake_notes text,

  -- Scores (set during/after audit call)
  score_missed_call text,         -- 'red' | 'yellow' | 'green' | null
  score_lead_response text,
  score_estimate_followup text,
  score_noshow text,
  score_stale_recovery text,
  score_pipeline_visibility text,
  overall_score text,

  -- Findings
  top_finding_1 text,
  top_finding_2 text,
  top_finding_3 text,

  -- Outcome
  recommended_package text,
  -- 'launch_sprint' | 'growth_system' | 'ai_os' | 'not_a_fit'
  proposal_sent boolean default false,
  auditor_notes text
);
RLS: Both tables require authenticated user for INSERT/UPDATE/DELETE. Public INSERT allowed on front_office_audits (intake form submissions from /audit/request).
sql-- Public intake form insert
create policy "public_audit_intake_insert"
on front_office_audits for insert
to anon
with check (true);

-- Authenticated read/write
create policy "auth_full_access_prospects"
on outbound_prospects for all
to authenticated using (true);

create policy "auth_full_access_audits"
on front_office_audits for all
to authenticated using (true);

5. COMPONENTS / PAGES BUILT
/audit — Public Landing Page
tsx// pages/audit/index.tsx
// Sections (in order):
// <AuditHero />          → headline, subheadline, CTA button
// <PainStrip />          → 5 pain points, horizontal flex
// <WhatIsAudit />        → 2-col text block
// <AuditDiagnosticGrid/> → 6-area grid (area + what we check)
// <AuditWhatYouGet />    → checklist block
// <AuditProcess />       → 3-step inline
// <WhoThisIsFor />       → bulleted qualifier block
// <AuditCTABlock />      → mid-page CTA
// <AuditFAQ />           → accordion or stacked Q&A
// <FooterCTA />          → final CTA
//
// All CTAs route to /audit/request
// Reuse existing ZenOps PageLayout, Button, and typography tokens

/audit/request — Intake Form
tsx// pages/audit/request.tsx
// Form sections:
//   Group 1: Business Info (name, trade type, city, phone, email)
//   Group 2: Team + Volume (team size, monthly leads, how leads come in)
//   Group 3: Current Tools (CRM/software, how follow-up works today)
//   Group 4: Pain Points (biggest front office problem, free text)
//   Group 5: Scheduling (preferred call times)
//
// On submit:
//   → INSERT to front_office_audits (anon insert)
//   → Redirect to /audit/book
//   → Optional: send confirmation email via Supabase edge function or Resend

/audit/book — Booking Page
tsx// pages/audit/book.tsx
// Option A (fast): Embed Calendly iframe
//   → wrap in ZenOps page shell
//   → add confirmation message above embed:
//     "You're almost there. Pick a time below for your free 20-minute
//      Front Office Audit call."
//
// Option B (native): Simple date/time picker form
//   → stores preferred_time on the front_office_audits row
//   → simpler, no external dependency
//
// Recommended: Option A for speed

/ops/outreach — Internal Outreach Tracker
tsx// pages/ops/outreach.tsx
// Protected route (authenticated only)
//
// Features:
//   → Table view of outbound_prospects
//   → Columns: Business Name, Trade, City, Status, Last Contact, Next Action, Next Action Date
//   → Filter by: status, trade_type
//   → Quick status update dropdown inline
//   → Add new prospect button → drawer form (ProspectDrawer.tsx)
//   → Click row → expand notes / history
//
// Reuse existing ZenOps Table, Badge, and Drawer patterns

/ops/audits — Internal Audit Management
tsx// pages/ops/audits.tsx
// Protected route (authenticated only)
//
// Features:
//   → Table of all front_office_audits
//   → Columns: Business, Trade, City, Audit Date, Call Status, Overall Score, Recommended Package, Proposal Sent
//   → Click row → AuditSummaryCard drawer
//     → Shows all 6 scores (Red/Yellow/Green badges)
//     → Shows top 3 findings
//     → Shows recommended package
//     → Inline field updates for post-call scoring
//   → Filter by: call_status, recommended_package, date range

6. TEMPLATE CONTENT LOCATIONS
Audit summary template text     → /ops/audits (AuditSummaryCard.tsx)
Offer sheet copy                → /audit/index.tsx (static, section-based)
Proposal template               → /public/templates/zenops-proposal-template.docx
                                   OR generate as a download in /ops/audits per row
Outreach email templates        → /ops/outreach (in ProspectDrawer as copy snippets)
Intake form questions           → /audit/request.tsx (hardcoded, pull from constants file)

7. LOCAL TEST STEPS
bash# 1. Run migrations
supabase db push

# 2. Verify tables exist
supabase db inspect

# 3. Test anon insert (intake form)
# → Go to /audit/request
# → Submit form
# → Verify row in front_office_audits table

# 4. Test protected routes
# → Log in as authenticated user
# → Navigate to /ops/outreach and /ops/audits
# → Verify data loads

# 5. Test booking redirect
# → Submit intake form → should redirect to /audit/book

# 6. Add test prospect via /ops/outreach
# → Click "Add Prospect" → fill form → save → verify in table

8. RECOMMENDED NEXT SMALL TASK
After this build is live:

Add email notification on new audit intake — when a prospect submits /audit/request, trigger a Supabase Edge Function → Resend email → notify your inbox instantly. One function, one template, 30 minutes.


That's the full delivery. Here's what you now have:

Section 2 — paste-ready landing page copy, section by section, contractor-first
Section 5 — 3 cold emails, 3 DMs, 3 follow-ups, 1 referral script, 1 authority post
Section 9 — full reusable proposal template defaulted to Contractor Launch Sprint
Section 10 — exact Google Sheets structure with all tab names, headers, and dropdown values
Implementation Pack — file structure, 2 migrations, 5 routes, component specs, RLS policies, test steps, and one clear next action
