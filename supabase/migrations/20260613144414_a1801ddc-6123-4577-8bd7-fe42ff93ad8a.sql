
DROP POLICY IF EXISTS "Authenticated users can read security findings" ON public.security_findings;
DROP POLICY IF EXISTS "Authenticated users can read ingest runs" ON public.security_ingest_runs;
DROP POLICY IF EXISTS "Authenticated users can read security memory" ON public.security_memory;

DROP POLICY IF EXISTS "Users update their own report images" ON storage.objects;
CREATE POLICY "Users update their own report images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'report-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'report-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
