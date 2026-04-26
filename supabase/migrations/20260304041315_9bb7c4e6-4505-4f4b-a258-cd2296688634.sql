
-- Schedule hourly background detection scan
SELECT cron.schedule(
  'hourly-anomaly-detection',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bwqdgorcraiidyqbwlno.supabase.co/functions/v1/background-detection',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cWRnb3JjcmFpaWR5cWJ3bG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODY1MjAsImV4cCI6MjA3NTA2MjUyMH0.4i4swbmAQfzloWYjlPOmwiT7nvXRVLvVwrOm7ssC2-g"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
