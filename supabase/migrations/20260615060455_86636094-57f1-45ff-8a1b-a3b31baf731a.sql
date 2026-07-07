-- Move role checks used by RLS policies out of the exposed public API schema.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT USAGE ON SCHEMA app_private TO service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
$$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO service_role;

-- Point admin-only RLS policies at the non-public helper.
ALTER POLICY "Admins can delete anomalies"
ON public.anomalies
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can update security findings"
ON public.security_findings
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view security findings"
ON public.security_findings
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view security ingest runs"
ON public.security_ingest_runs
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can modify security memory"
ON public.security_memory
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view security memory"
ON public.security_memory
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view all reports"
ON public.user_reports
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

-- Prevent direct API execution of internal SECURITY DEFINER helpers.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.set_chat_username() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_chat_username() FROM anon;
REVOKE ALL ON FUNCTION public.set_chat_username() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_chat_username() TO service_role;