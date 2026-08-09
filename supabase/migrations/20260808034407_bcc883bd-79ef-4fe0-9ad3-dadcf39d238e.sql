GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT ON public.email_alert_logs TO authenticated;
GRANT ALL ON public.email_alert_logs TO service_role;

GRANT SELECT ON public.anomalies TO authenticated;
GRANT ALL ON public.anomalies TO service_role;

GRANT SELECT ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;

REVOKE ALL ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO authenticated, service_role;