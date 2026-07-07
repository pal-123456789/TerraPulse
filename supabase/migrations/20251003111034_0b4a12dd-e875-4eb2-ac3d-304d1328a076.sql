-- Create environmental_data table to store sensor readings
CREATE TABLE public.environmental_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  pressure DECIMAL(7, 2),
  wind_speed DECIMAL(5, 2),
  weather_condition TEXT,
  data_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create anomalies table to store detected environmental anomalies
CREATE TABLE public.anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB
);

-- Create predictions table for AI-based forecasts
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  prediction_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  confidence DECIMAL(5, 2),
  forecast_data JSONB,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_reports table for community contributions
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  report_type TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.environmental_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no authentication required for viewing)
CREATE POLICY "Public read access for environmental_data"
ON public.environmental_data FOR SELECT
USING (true);

CREATE POLICY "Public read access for anomalies"
ON public.anomalies FOR SELECT
USING (true);

CREATE POLICY "Public read access for predictions"
ON public.predictions FOR SELECT
USING (true);

CREATE POLICY "Public read access for user_reports"
ON public.user_reports FOR SELECT
USING (true);

-- Create policies for public write access (no authentication required)
CREATE POLICY "Public insert access for environmental_data"
ON public.environmental_data FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public insert access for user_reports"
ON public.user_reports FOR INSERT
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_environmental_data_location ON public.environmental_data (latitude, longitude);
CREATE INDEX idx_environmental_data_created_at ON public.environmental_data (created_at DESC);
CREATE INDEX idx_anomalies_location ON public.anomalies (latitude, longitude);
CREATE INDEX idx_anomalies_status ON public.anomalies (status);
CREATE INDEX idx_predictions_location ON public.predictions (latitude, longitude);
CREATE INDEX idx_predictions_valid_until ON public.predictions (valid_until);

-- Create function to auto-update anomaly status based on time
CREATE OR REPLACE FUNCTION update_anomaly_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.detected_at < NOW() - INTERVAL '7 days' AND NEW.status = 'active' THEN
    NEW.status = 'resolved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for anomaly status updates
CREATE TRIGGER check_anomaly_status
BEFORE INSERT OR UPDATE ON public.anomalies
FOR EACH ROW
EXECUTE FUNCTION update_anomaly_status();