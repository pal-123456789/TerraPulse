
-- 1. Create avatars storage bucket (public read, owner-scoped writes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Ensure unique constraint on user_course_progress for upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_course_progress_user_course_unique'
  ) THEN
    ALTER TABLE public.user_course_progress
    ADD CONSTRAINT user_course_progress_user_course_unique
    UNIQUE (user_id, course_id);
  END IF;
END $$;

-- 3. Allow authenticated users to delete anomalies (history cleanup)
CREATE POLICY "Authenticated users can delete anomalies"
ON public.anomalies FOR DELETE
TO authenticated
USING (true);
