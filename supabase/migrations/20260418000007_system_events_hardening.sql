-- System events table with idempotency for automation hardening
CREATE TABLE IF NOT EXISTS system_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        text        NOT NULL,
  entity_type       text        NOT NULL,
  entity_id         uuid        NOT NULL,
  idempotency_key   text        UNIQUE NOT NULL,
  payload           jsonb       NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','done','failed')),
  attempts          int         NOT NULL DEFAULT 0,
  max_attempts      int         NOT NULL DEFAULT 3,
  last_error        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  processed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS system_events_status_idx     ON system_events(status) WHERE status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS system_events_entity_idx     ON system_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS system_events_created_at_idx ON system_events(created_at DESC);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON system_events USING (false);

-- Notification read-state table
CREATE TABLE IF NOT EXISTS notification_reads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id        uuid        NOT NULL,
  read_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns reads" ON notification_reads USING (auth.uid() = user_id);

-- Trigger: lead_created event
CREATE OR REPLACE FUNCTION fn_emit_lead_created() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO system_events(event_type, entity_type, entity_id, idempotency_key, payload)
  VALUES (
    'lead_created', 'lead', NEW.id,
    'lead_created:' || NEW.id,
    jsonb_build_object('business_name', NEW.business_name, 'status', NEW.status, 'source', NEW.source)
  ) ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_created ON leads;
CREATE TRIGGER trg_lead_created AFTER INSERT ON leads FOR EACH ROW EXECUTE FUNCTION fn_emit_lead_created();

-- Trigger: lead_updated event
CREATE OR REPLACE FUNCTION fn_emit_lead_updated() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO system_events(event_type, entity_type, entity_id, idempotency_key, payload)
    VALUES (
      'lead_status_changed', 'lead', NEW.id,
      'lead_status_changed:' || NEW.id || ':' || OLD.status || ':' || NEW.status || ':' || extract(epoch from now())::text,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'business_name', NEW.business_name)
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_updated ON leads;
CREATE TRIGGER trg_lead_updated AFTER UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION fn_emit_lead_updated();

-- Trigger: audit_completed event
CREATE OR REPLACE FUNCTION fn_emit_audit_completed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    INSERT INTO system_events(event_type, entity_type, entity_id, idempotency_key, payload)
    VALUES (
      'audit_completed', 'audit', NEW.id,
      'audit_completed:' || NEW.id,
      jsonb_build_object('business_name', NEW.business_name, 'recommended_package', NEW.recommended_package)
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_audit_completed ON front_office_audits;
CREATE TRIGGER trg_audit_completed AFTER UPDATE ON front_office_audits FOR EACH ROW EXECUTE FUNCTION fn_emit_audit_completed();

-- View for retryable failed events (attempts < max_attempts)
CREATE OR REPLACE VIEW retryable_system_events AS
  SELECT * FROM system_events
  WHERE status = 'failed' AND attempts < max_attempts
  ORDER BY created_at;
