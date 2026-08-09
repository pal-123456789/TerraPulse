-- Create chat_messages table for real-time community chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view messages
CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can send messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;