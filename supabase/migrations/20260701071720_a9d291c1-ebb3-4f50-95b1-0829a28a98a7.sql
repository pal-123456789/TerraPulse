
-- Fix 1: chat-images bucket — replace public SELECT with authenticated-only
DROP POLICY IF EXISTS "Chat images are publicly readable" ON storage.objects;

CREATE POLICY "Authenticated users can read chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

-- Fix 2: realtime.messages — explicitly authorize community topics for comments/reactions
CREATE POLICY "Authenticated users read community channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ANY (ARRAY['comments'::text, 'reactions'::text])
);
