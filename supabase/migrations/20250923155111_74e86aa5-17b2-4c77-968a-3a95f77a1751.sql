-- First, let's add unique constraint to admin table if it doesn't exist
ALTER TABLE public.admin ADD CONSTRAINT admin_user_id_unique UNIQUE (user_id);

-- Create admin user using Supabase auth.admin_create_user function
SELECT auth.admin_create_user(
  'admin@internal.system',
  'innovation-ai',
  '{"username": "admin"}'::jsonb,
  true, -- email_confirmed
  true   -- auto_confirm
);

-- Insert admin record in admin table
INSERT INTO public.admin (user_id, username, agent_name, role, state)
SELECT 
  id,
  'admin',
  'ฝนส./ฝปดน.',
  'admin',
  'enable'
FROM auth.users 
WHERE email = 'admin@internal.system'
ON CONFLICT (user_id) DO UPDATE SET
  username = 'admin',
  role = 'admin',
  state = 'enable';