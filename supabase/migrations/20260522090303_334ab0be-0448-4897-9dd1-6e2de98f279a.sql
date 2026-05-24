-- Allow users to delete their own chat messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Expose user_id in the public chat view so the client can identify ownership
DROP VIEW IF EXISTS public.chat_messages_public;
CREATE VIEW public.chat_messages_public
WITH (security_invoker = true)
AS
SELECT id, content, username, created_at, image_url, user_id
FROM public.chat_messages;

GRANT SELECT ON public.chat_messages_public TO authenticated, anon;