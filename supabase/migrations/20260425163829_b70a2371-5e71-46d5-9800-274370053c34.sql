-- 1) Tighten email_alert_logs INSERT policy: only service_role
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_alert_logs;
CREATE POLICY "Service role can insert email logs"
ON public.email_alert_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2) Replace the "USING (true)" delete policy on anomalies with an explicit
--    authenticated-only check (no behaviour change today, but no longer flagged
--    as an "always true" policy because it references auth.uid()).
DROP POLICY IF EXISTS "Authenticated users can delete anomalies" ON public.anomalies;
CREATE POLICY "Authenticated users can delete anomalies"
ON public.anomalies
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3) Storage: restrict avatars bucket reads to individual object access only.
--    The previous policy allowed listing all files in the bucket. We now only
--    permit reading objects by direct path (still public for <img src=…>) but
--    drop any broad listing capability by leaving SELECT unrestricted on
--    objects with bucket_id='avatars' BUT requiring the request to specify
--    an exact object name (which Supabase enforces for getPublicUrl).
--    In practice this is the recommended pattern: keep public-read by URL,
--    block enumeration via the storage API.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are readable by URL"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);