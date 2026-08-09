
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own private channel" ON realtime.messages;
DROP POLICY IF EXISTS "Users write own private channel" ON realtime.messages;

CREATE POLICY "Users read own private channel"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('notifications:' || auth.uid()::text)
    OR realtime.topic() = ('user_reports:' || auth.uid()::text)
  );

CREATE POLICY "Users write own private channel"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = ('notifications:' || auth.uid()::text)
    OR realtime.topic() = ('user_reports:' || auth.uid()::text)
  );

DROP POLICY IF EXISTS "Block role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "Block role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Block role deletes" ON public.user_roles;

CREATE POLICY "Block role inserts" ON public.user_roles
  FOR INSERT TO authenticated, anon WITH CHECK (false);

CREATE POLICY "Block role updates" ON public.user_roles
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

CREATE POLICY "Block role deletes" ON public.user_roles
  FOR DELETE TO authenticated, anon USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;
GRANT ALL ON public.user_roles TO service_role;
