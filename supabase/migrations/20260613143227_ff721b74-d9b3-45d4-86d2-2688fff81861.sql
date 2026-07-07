
-- 1. security_findings: admin-only read
DROP POLICY IF EXISTS "Authenticated users can view security findings" ON public.security_findings;
DROP POLICY IF EXISTS "Authenticated can view security findings" ON public.security_findings;
DROP POLICY IF EXISTS "Users can view security findings" ON public.security_findings;
CREATE POLICY "Admins can view security findings"
  ON public.security_findings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. security_memory: admin-only read
DROP POLICY IF EXISTS "Authenticated users can view security memory" ON public.security_memory;
DROP POLICY IF EXISTS "Authenticated can view security memory" ON public.security_memory;
DROP POLICY IF EXISTS "Users can view security memory" ON public.security_memory;
CREATE POLICY "Admins can view security memory"
  ON public.security_memory FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. security_ingest_runs: admin-only read
DROP POLICY IF EXISTS "Authenticated users can view ingest runs" ON public.security_ingest_runs;
DROP POLICY IF EXISTS "Authenticated can view ingest runs" ON public.security_ingest_runs;
DROP POLICY IF EXISTS "Users can view ingest runs" ON public.security_ingest_runs;
CREATE POLICY "Admins can view security ingest runs"
  ON public.security_ingest_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. user_reports: owners can read their own reports only
DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.user_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can view all reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can view reports" ON public.user_reports;
CREATE POLICY "Users can view their own reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports"
  ON public.user_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. rate_limits: no client writes. The check_rate_limit() SECURITY DEFINER
-- function continues to manage rows server-side. Drop any permissive ALL/insert/update/delete policies.
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users manage own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Authenticated users can manage rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can insert their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can update their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can delete their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;

-- Revoke direct client privileges; service_role retains full access.
REVOKE INSERT, UPDATE, DELETE ON public.rate_limits FROM authenticated, anon;

-- Optional: allow authenticated users to view their own counters (read-only).
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
