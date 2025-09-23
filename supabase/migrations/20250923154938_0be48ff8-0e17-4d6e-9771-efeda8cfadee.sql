-- Create admin user account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@internal.system',
  crypt('innovation-ai', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "admin"}'::jsonb,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

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