CREATE TABLE IF NOT EXISTS gmail_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  access_token text,
  refresh_token text,
  gmail_email text,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint so upsert on user_id works
ALTER TABLE gmail_connections
  DROP CONSTRAINT IF EXISTS gmail_connections_user_id_key;
ALTER TABLE gmail_connections
  ADD CONSTRAINT gmail_connections_user_id_key UNIQUE (user_id);
