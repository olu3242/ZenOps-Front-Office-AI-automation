CREATE TABLE onboarding_progress (
  organization_id  uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  business_type    text,
  step_completed   int  NOT NULL DEFAULT 0,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org member" ON onboarding_progress USING (organization_id = current_org_id());
