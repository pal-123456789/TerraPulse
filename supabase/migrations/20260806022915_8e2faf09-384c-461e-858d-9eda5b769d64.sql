-- 1. user_reports: enforce ownership
ALTER TABLE public.user_reports ALTER COLUMN user_id SET NOT NULL;

-- 2. notification_preferences: prevent row hijacking on update
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. chat-images storage: owner-scoped writes, authenticated reads
DROP POLICY IF EXISTS "Authenticated users can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;

CREATE POLICY "Authenticated users can view chat images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can upload their own chat images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own chat images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);