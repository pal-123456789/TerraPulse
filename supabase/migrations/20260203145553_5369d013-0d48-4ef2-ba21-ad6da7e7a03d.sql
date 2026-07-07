-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create courses table for dynamic learning content
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT NOT NULL DEFAULT '1h',
  lessons INTEGER NOT NULL DEFAULT 5,
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  icon TEXT NOT NULL DEFAULT 'Globe',
  color TEXT NOT NULL DEFAULT 'hsl(180, 100%, 50%)',
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_progress table to track progress
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Courses are public read
CREATE POLICY "Courses are viewable by everyone"
ON public.courses FOR SELECT
USING (is_active = true);

-- User progress policies
CREATE POLICY "Users can view their own progress"
ON public.user_course_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_course_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_course_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default courses
INSERT INTO public.courses (title, description, duration, lessons, level, icon, color, topics, order_index) VALUES
('Climate Fundamentals', 'Learn the basics of climate science and weather patterns affecting our planet', '2h 30m', 12, 'Beginner', 'Globe', 'hsl(180, 100%, 50%)', ARRAY['Atmosphere', 'Climate Zones', 'Weather vs Climate'], 1),
('Weather Pattern Analysis', 'Analyze complex weather systems and predict patterns using modern techniques', '3h 15m', 18, 'Intermediate', 'Wind', 'hsl(200, 100%, 50%)', ARRAY['Fronts', 'Pressure Systems', 'Storm Tracking'], 2),
('AI in Environmental Science', 'Machine learning applications in environmental monitoring and prediction', '4h', 24, 'Advanced', 'Brain', 'hsl(270, 70%, 60%)', ARRAY['Neural Networks', 'Pattern Recognition', 'Predictive Models'], 3),
('Satellite Data Interpretation', 'Read and analyze satellite imagery for environmental insights', '2h 45m', 15, 'Intermediate', 'Satellite', 'hsl(45, 100%, 60%)', ARRAY['Remote Sensing', 'Image Analysis', 'Data Processing'], 4),
('Ocean & Marine Systems', 'Understanding ocean currents, temperatures and marine ecosystems', '3h', 16, 'Intermediate', 'Waves', 'hsl(200, 80%, 60%)', ARRAY['Currents', 'El Niño', 'Marine Life'], 5),
('Disaster Preparedness', 'Learn how to prepare for and respond to natural disasters effectively', '2h', 10, 'Beginner', 'Shield', 'hsl(0, 84%, 60%)', ARRAY['Earthquakes', 'Hurricanes', 'Evacuation'], 6),
('Polar Climate Dynamics', 'Understanding Arctic and Antarctic climate systems and their global impact', '2h 30m', 14, 'Advanced', 'Snowflake', 'hsl(200, 80%, 70%)', ARRAY['Ice Sheets', 'Permafrost', 'Sea Level'], 7),
('Solar & Space Weather', 'How the sun and space weather affect Earth environment and technology', '1h 45m', 8, 'Intermediate', 'Sun', 'hsl(45, 100%, 60%)', ARRAY['Solar Cycles', 'Geomagnetic Storms', 'Aurora'], 8);

-- Create triggers
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_progress_last_activity
BEFORE UPDATE ON public.user_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();