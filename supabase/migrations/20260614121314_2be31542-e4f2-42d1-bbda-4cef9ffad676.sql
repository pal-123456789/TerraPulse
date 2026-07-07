
-- 1. Rename existing wiz findings to aikido
UPDATE public.security_findings SET scanner = 'aikido' WHERE scanner = 'wiz';

-- 2. Remediation rules
CREATE TABLE public.ops_remediation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_source text NOT NULL CHECK (trigger_source IN ('sentry','aikido')),
  trigger_severity text NOT NULL DEFAULT 'high' CHECK (trigger_severity IN ('low','medium','high','critical','any')),
  trigger_match text,
  action text NOT NULL CHECK (action IN ('email','webhook')),
  action_target text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_remediation_rules TO authenticated;
GRANT ALL ON public.ops_remediation_rules TO service_role;

ALTER TABLE public.ops_remediation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rules" ON public.ops_remediation_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ops_remediation_rules_updated_at
  BEFORE UPDATE ON public.ops_remediation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Remediation run log
CREATE TABLE public.ops_remediation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.ops_remediation_rules(id) ON DELETE CASCADE,
  source text NOT NULL,
  finding_ref text,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ops_remediation_runs TO authenticated;
GRANT ALL ON public.ops_remediation_runs TO service_role;

ALTER TABLE public.ops_remediation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own runs" ON public.ops_remediation_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service writes runs" ON public.ops_remediation_runs
  FOR INSERT WITH CHECK (true);

CREATE INDEX ops_remediation_runs_user_created_idx ON public.ops_remediation_runs(user_id, created_at DESC);
CREATE INDEX ops_remediation_rules_user_idx ON public.ops_remediation_rules(user_id, enabled);
