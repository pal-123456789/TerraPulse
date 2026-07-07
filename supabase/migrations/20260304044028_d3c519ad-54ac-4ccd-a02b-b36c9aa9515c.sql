
CREATE TABLE public.email_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  anomaly_name text NOT NULL,
  anomaly_type text,
  severity text,
  latitude numeric,
  longitude numeric,
  email_sent_to text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs" ON public.email_alert_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert email logs" ON public.email_alert_logs
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_email_alert_logs_user ON public.email_alert_logs(user_id, created_at DESC);
