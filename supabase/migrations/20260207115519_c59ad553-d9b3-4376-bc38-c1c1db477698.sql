-- Fix Security Definer View warnings by recreating views with SECURITY INVOKER

-- 1. Recreate public_profiles view with explicit security invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = on)
AS
SELECT 
  id,
  username,
  avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 2. Recreate public_reports view with explicit security invoker
DROP VIEW IF EXISTS public.public_reports;
CREATE VIEW public.public_reports
WITH (security_invoker = on)
AS
SELECT 
  id,
  report_type,
  description,
  ROUND(latitude::numeric, 1) as latitude,
  ROUND(longitude::numeric, 1) as longitude,
  image_url,
  created_at
FROM public.user_reports;

GRANT SELECT ON public.public_reports TO authenticated;

-- 3. Recreate chat_messages_public view with explicit security invoker
DROP VIEW IF EXISTS public.chat_messages_public;
CREATE VIEW public.chat_messages_public
WITH (security_invoker = on)
AS
SELECT 
  id,
  username,
  content,
  created_at
FROM public.chat_messages;

GRANT SELECT ON public.chat_messages_public TO authenticated;