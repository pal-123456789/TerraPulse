
DROP POLICY IF EXISTS "Service writes runs" ON public.ops_remediation_runs;
CREATE POLICY "Users insert own runs" ON public.ops_remediation_runs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
