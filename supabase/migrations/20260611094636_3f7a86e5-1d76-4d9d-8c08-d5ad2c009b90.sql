-- Security findings table (ingested from scanners like Wiz)
CREATE TABLE IF NOT EXISTS public.security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','fixed','ignored')),
  connector TEXT,
  resource TEXT,
  remediation TEXT,
  fixable BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fixed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scanner, external_id)
);

GRANT SELECT ON public.security_findings TO authenticated;
GRANT ALL ON public.security_findings TO service_role;

ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read security findings"
  ON public.security_findings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update security findings"
  ON public.security_findings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_security_findings_updated_at
  BEFORE UPDATE ON public.security_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_security_findings_severity ON public.security_findings(severity);
CREATE INDEX IF NOT EXISTS idx_security_findings_status   ON public.security_findings(status);
CREATE INDEX IF NOT EXISTS idx_security_findings_scanner  ON public.security_findings(scanner);
CREATE INDEX IF NOT EXISTS idx_security_findings_connector ON public.security_findings(connector);

-- Security memory: actionable items auto-imported from scans
CREATE TABLE IF NOT EXISTS public.security_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  fixable BOOLEAN NOT NULL DEFAULT true,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

GRANT SELECT ON public.security_memory TO authenticated;
GRANT ALL  ON public.security_memory TO service_role;

ALTER TABLE public.security_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read security memory"
  ON public.security_memory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify security memory"
  ON public.security_memory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_security_memory_updated_at
  BEFORE UPDATE ON public.security_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track ingestion runs
CREATE TABLE IF NOT EXISTS public.security_ingest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner TEXT NOT NULL,
  status TEXT NOT NULL,
  findings_imported INT NOT NULL DEFAULT 0,
  memory_items_added INT NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

GRANT SELECT ON public.security_ingest_runs TO authenticated;
GRANT ALL  ON public.security_ingest_runs TO service_role;

ALTER TABLE public.security_ingest_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ingest runs"
  ON public.security_ingest_runs FOR SELECT TO authenticated USING (true);

-- Enable extensions for scheduled ingestion
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;