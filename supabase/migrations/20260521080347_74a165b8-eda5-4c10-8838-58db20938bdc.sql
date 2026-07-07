
-- Add image support to chat messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Allow empty text messages when an image is attached: drop and recreate insert policy
DROP POLICY IF EXISTS "Users can only insert their own messages" ON public.chat_messages;
CREATE POLICY "Users can only insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND char_length(content) <= 1000
  AND (char_length(content) > 0 OR image_url IS NOT NULL)
);

-- Recreate the chat_messages_public view to include image_url (used by client)
DROP VIEW IF EXISTS public.chat_messages_public;
CREATE VIEW public.chat_messages_public
WITH (security_invoker = true)
AS
SELECT id, content, username, created_at, image_url
FROM public.chat_messages;

-- Create a public bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-images (folder = auth.uid())
DROP POLICY IF EXISTS "Chat images are publicly readable" ON storage.objects;
CREATE POLICY "Chat images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
