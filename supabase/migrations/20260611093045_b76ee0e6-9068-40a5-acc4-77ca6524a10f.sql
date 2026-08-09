
-- 1. Admin roles system
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Anomalies: restrict DELETE to admins only
DROP POLICY IF EXISTS "Authenticated users can delete anomalies" ON public.anomalies;
CREATE POLICY "Admins can delete anomalies"
  ON public.anomalies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Chat messages: require auth to read
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can view chat messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.chat_messages FROM anon;

-- 4. Storage policies for private report-images bucket
-- (Bucket itself must be created in the Storage dashboard as PRIVATE.)
DROP POLICY IF EXISTS "Users upload their own report images" ON storage.objects;
CREATE POLICY "Users upload their own report images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users read their own report images" ON storage.objects;
CREATE POLICY "Users read their own report images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete their own report images" ON storage.objects;
CREATE POLICY "Users delete their own report images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Lock down rate_limit helper (SECURITY DEFINER) so clients cannot call it
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;
