-- Fix RLS policies for user_reports table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view user reports" ON public.user_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.user_reports;

-- Create comprehensive RLS policies for user_reports
CREATE POLICY "Users can create their own reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view reports" 
ON public.user_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own reports" 
ON public.user_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.user_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for profiles table - restrict to authenticated users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Fix environmental_data table - restrict INSERT to service role only
DROP POLICY IF EXISTS "Public insert access for environmental_data" ON public.environmental_data;

-- No INSERT policy needed - only service role (edge functions) should insert
-- Public can still read the data

-- Add constraints for data validation
ALTER TABLE public.user_reports 
ADD CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
ADD CONSTRAINT description_length CHECK (char_length(description) <= 5000);

ALTER TABLE public.environmental_data
ADD CONSTRAINT env_valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT env_valid_longitude CHECK (longitude >= -180 AND longitude <= 180);