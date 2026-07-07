-- ==========================================
-- SECURITY FIX: Comprehensive RLS Hardening
-- ==========================================

-- First: Clean up chat_messages with NULL user_id (old anonymous messages)
DELETE FROM public.chat_messages WHERE user_id IS NULL;

-- 1. CREATE RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rate limits"
ON public.rate_limits
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. FIX PROFILES TABLE - Restrict to own profile only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Public profiles view for displaying usernames/avatars only
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 3. FIX USER_REPORTS - Restrict and anonymize
DROP POLICY IF EXISTS "Anyone can view reports" ON public.user_reports;

CREATE POLICY "Authenticated users can view reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (true);

-- Create public view with fuzzy coordinates (1 decimal = ~11km accuracy)
CREATE OR REPLACE VIEW public.public_reports AS
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

-- 4. FIX CHAT_MESSAGES - Enforce strict user validation
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;

CREATE POLICY "Users can only insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  char_length(content) > 0 AND
  char_length(content) <= 1000
);

-- Make user_id required
ALTER TABLE public.chat_messages 
ALTER COLUMN user_id SET NOT NULL;

-- Add content length constraint
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_message_content_length CHECK (
  char_length(content) > 0 AND 
  char_length(content) <= 1000
);

-- Create function to auto-set username from profile
CREATE OR REPLACE FUNCTION public.set_chat_username()
RETURNS TRIGGER AS $$
BEGIN
  SELECT username INTO NEW.username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := 'User_' || substring(NEW.user_id::text from 1 for 8);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_chat_username_trigger ON public.chat_messages;
CREATE TRIGGER set_chat_username_trigger
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.set_chat_username();

-- 5. CREATE CHAT MESSAGES PUBLIC VIEW (without user_id exposure)
CREATE OR REPLACE VIEW public.chat_messages_public AS
SELECT 
  id,
  username,
  content,
  created_at
FROM public.chat_messages;

GRANT SELECT ON public.chat_messages_public TO authenticated;

-- 6. RATE LIMIT CHECKING FUNCTION
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes || ' minutes')::interval;
  
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, date_trunc('minute', now()))
  ON CONFLICT (user_id, endpoint, window_start) 
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  DELETE FROM public.rate_limits
  WHERE window_start < v_window_start;
  
  RETURN jsonb_build_object(
    'exceeded', v_count >= p_max_requests,
    'count', v_count,
    'limit', p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_count)
  );
END;
$$;