-- ─── PLANS ──────────────────────────────────────────────────────────────────
CREATE TABLE plans (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  stripe_price_id     text,
  price_monthly_cents int  NOT NULL DEFAULT 0,
  leads_limit         int,
  automations_limit   int,
  users_limit         int,
  exports_limit       int,
  outreach_limit      int,
  features            text[] NOT NULL DEFAULT '{}'
);

INSERT INTO plans VALUES
  ('trial',   'Trial',   NULL,      0, 100,  5,    1,  10,   50,   ARRAY['leads','tasks','audits','automation']),
  ('starter', 'Starter', NULL,   4900, 250,  10,   1,  50,   200,  ARRAY['leads','tasks','audits','automation','export']),
  ('growth',  'Growth',  NULL,  14900, 1000, 50,   5,  500,  2000, ARRAY['leads','tasks','audits','automation','export','api']),
  ('elite',   'Elite',   NULL,  29900, NULL, NULL, NULL, NULL, NULL, ARRAY['leads','tasks','audits','automation','export','api','custom']);

-- ─── ORGANIZATIONS ───────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL DEFAULT 'My Organization',
  owner_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── USER → ORG MAP ──────────────────────────────────────────────────────────
CREATE TABLE user_organizations (
  user_id         uuid REFERENCES auth.users(id)    ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','member')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id                 text NOT NULL REFERENCES plans(id) DEFAULT 'trial',
  stripe_subscription_id  text UNIQUE,
  stripe_customer_id      text,
  status                  text NOT NULL DEFAULT 'trialing'
                            CHECK (status IN ('trialing','active','past_due','canceled','unpaid','incomplete')),
  trial_ends_at           timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ─── USAGE TRACKING ──────────────────────────────────────────────────────────
CREATE TABLE organization_usage (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start      date NOT NULL DEFAULT date_trunc('month', now())::date,
  leads_count       int  NOT NULL DEFAULT 0,
  automations_count int  NOT NULL DEFAULT 0,
  exports_count     int  NOT NULL DEFAULT 0,
  outreach_count    int  NOT NULL DEFAULT 0,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans              ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read plans"     ON plans              FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid
  LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1
  $$;

CREATE POLICY "org member"  ON organizations      USING (id = current_org_id());
CREATE POLICY "org member"  ON subscriptions      USING (organization_id = current_org_id());
CREATE POLICY "org member"  ON user_organizations USING (organization_id = current_org_id());
CREATE POLICY "org member"  ON organization_usage USING (organization_id = current_org_id());

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_usage(p_org_id uuid, p_metric text, p_amount int DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_period date := date_trunc('month', now())::date; BEGIN
  INSERT INTO organization_usage(organization_id, period_start)
  VALUES (p_org_id, v_period) ON CONFLICT (organization_id, period_start) DO NOTHING;
  IF    p_metric = 'leads'       THEN UPDATE organization_usage SET leads_count       = leads_count       + p_amount, updated_at = now() WHERE organization_id = p_org_id AND period_start = v_period;
  ELSIF p_metric = 'automations' THEN UPDATE organization_usage SET automations_count = automations_count + p_amount, updated_at = now() WHERE organization_id = p_org_id AND period_start = v_period;
  ELSIF p_metric = 'exports'     THEN UPDATE organization_usage SET exports_count     = exports_count     + p_amount, updated_at = now() WHERE organization_id = p_org_id AND period_start = v_period;
  ELSIF p_metric = 'outreach'    THEN UPDATE organization_usage SET outreach_count    = outreach_count    + p_amount, updated_at = now() WHERE organization_id = p_org_id AND period_start = v_period;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION check_plan_limit(p_org_id uuid, p_metric text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_limit    int;
  v_current  int := 0;
  v_period   date := date_trunc('month', now())::date;
  v_sub_status text;
  v_trial_ends timestamptz;
BEGIN
  SELECT s.status, s.trial_ends_at,
    CASE p_metric
      WHEN 'leads'       THEN p.leads_limit
      WHEN 'automations' THEN p.automations_limit
      WHEN 'exports'     THEN p.exports_limit
      WHEN 'outreach'    THEN p.outreach_limit
    END
  INTO v_sub_status, v_trial_ends, v_limit
  FROM subscriptions s JOIN plans p ON p.id = s.plan_id
  WHERE s.organization_id = p_org_id
  ORDER BY s.created_at DESC LIMIT 1;

  IF v_sub_status = 'trialing' AND v_trial_ends < now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'trial_expired', 'limit', v_limit, 'current', 0);
  END IF;
  IF v_sub_status IN ('canceled', 'unpaid') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_inactive', 'limit', 0, 'current', 0);
  END IF;
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true,  'reason', 'unlimited', 'limit', null, 'current', 0);
  END IF;

  SELECT COALESCE(CASE p_metric
    WHEN 'leads'       THEN leads_count
    WHEN 'automations' THEN automations_count
    WHEN 'exports'     THEN exports_count
    WHEN 'outreach'    THEN outreach_count
  END, 0) INTO v_current
  FROM organization_usage WHERE organization_id = p_org_id AND period_start = v_period;

  RETURN jsonb_build_object(
    'allowed',  v_current < v_limit,
    'reason',   CASE WHEN v_current >= v_limit THEN 'limit_reached' ELSE 'ok' END,
    'limit',    v_limit,
    'current',  COALESCE(v_current, 0),
    'pct',      ROUND((COALESCE(v_current, 0)::numeric / v_limit) * 100)
  );
END; $$;

-- Auto-create org + 14-day trial on user signup
CREATE OR REPLACE FUNCTION fn_provision_org_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id uuid; BEGIN
  INSERT INTO organizations(name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.id)
  RETURNING id INTO v_org_id;
  INSERT INTO user_organizations(user_id, organization_id, role) VALUES (NEW.id, v_org_id, 'owner');
  INSERT INTO subscriptions(organization_id, plan_id, status, trial_ends_at)
  VALUES (v_org_id, 'trial', 'trialing', now() + interval '14 days');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_provision_org_on_signup ON auth.users;
CREATE TRIGGER trg_provision_org_on_signup
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION fn_provision_org_on_signup();

-- Trigger: increment leads usage on lead creation
CREATE OR REPLACE FUNCTION fn_track_lead_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id uuid;
BEGIN
  SELECT current_org_id() INTO v_org_id;
  IF v_org_id IS NOT NULL THEN PERFORM increment_usage(v_org_id, 'leads'); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_track_lead_created ON leads;
CREATE TRIGGER trg_track_lead_created AFTER INSERT ON leads FOR EACH ROW EXECUTE FUNCTION fn_track_lead_created();

-- Trigger: increment outreach usage
CREATE OR REPLACE FUNCTION fn_track_outreach_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id uuid;
BEGIN
  SELECT current_org_id() INTO v_org_id;
  IF v_org_id IS NOT NULL THEN PERFORM increment_usage(v_org_id, 'outreach'); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_track_outreach_created ON outreach_records;
CREATE TRIGGER trg_track_outreach_created AFTER INSERT ON outreach_records FOR EACH ROW EXECUTE FUNCTION fn_track_outreach_created();

-- Trigger: increment automation usage when event processed
CREATE OR REPLACE FUNCTION fn_track_automation_executed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id uuid;
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    SELECT current_org_id() INTO v_org_id;
    IF v_org_id IS NOT NULL THEN PERFORM increment_usage(v_org_id, 'automations'); END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_track_automation ON system_events;
CREATE TRIGGER trg_track_automation AFTER UPDATE ON system_events FOR EACH ROW EXECUTE FUNCTION fn_track_automation_executed();
