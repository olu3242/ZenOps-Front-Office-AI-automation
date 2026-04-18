-- Team invitations table
CREATE TABLE team_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  token           text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org member" ON team_invitations USING (organization_id = current_org_id());
CREATE INDEX IF NOT EXISTS team_invitations_token_idx ON team_invitations(token);
CREATE INDEX IF NOT EXISTS team_invitations_email_idx ON team_invitations(email);

-- View: org members with user info
CREATE OR REPLACE VIEW org_members AS
  SELECT
    uo.organization_id,
    uo.user_id,
    uo.role,
    uo.created_at AS joined_at,
    u.email,
    u.raw_user_meta_data->>'name' AS name
  FROM user_organizations uo
  JOIN auth.users u ON u.id = uo.user_id;
