-- Fix search path for update_anomaly_status function
CREATE OR REPLACE FUNCTION public.update_anomaly_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.detected_at < NOW() - INTERVAL '7 days' AND NEW.status = 'active' THEN
    NEW.status = 'resolved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;