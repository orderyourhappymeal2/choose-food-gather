-- Add unique constraint to admin table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_user_id_unique' 
        AND conrelid = 'public.admin'::regclass
    ) THEN
        ALTER TABLE public.admin ADD CONSTRAINT admin_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Create admin record manually (assuming we'll create the auth user separately)
INSERT INTO public.admin (user_id, username, agent_name, role, state)
VALUES (
  gen_random_uuid(),
  'admin',
  'ฝนส./ฝปดน.',
  'admin',
  'enable'
) ON CONFLICT (user_id) DO UPDATE SET
  username = 'admin',
  role = 'admin',
  state = 'enable';