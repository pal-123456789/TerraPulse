
CREATE TABLE public.response_hub_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sms_phone TEXT,
  sms_from TEXT,
  teams_team_id TEXT,
  teams_channel_id TEXT,
  excel_item_id TEXT,
  excel_worksheet TEXT DEFAULT 'Sheet1',
  voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  min_severity TEXT NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.response_hub_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hub config" ON public.response_hub_config
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hub config" ON public.response_hub_config
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hub config" ON public.response_hub_config
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hub config" ON public.response_hub_config
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_response_hub_config_updated
  BEFORE UPDATE ON public.response_hub_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.response_hub_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  anomaly_id UUID,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channels JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  audio_url TEXT,
  place_name TEXT,
  error TEXT
);

ALTER TABLE public.response_hub_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own hub runs" ON public.response_hub_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service inserts hub runs" ON public.response_hub_runs
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service updates hub runs" ON public.response_hub_runs
  FOR UPDATE TO service_role USING (true);

CREATE INDEX idx_hub_runs_user ON public.response_hub_runs(user_id, triggered_at DESC);
