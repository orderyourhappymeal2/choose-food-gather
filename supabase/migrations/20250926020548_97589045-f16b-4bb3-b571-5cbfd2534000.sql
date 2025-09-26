-- Update passwords for existing admin users
-- Set password to 'innovation-ai' for both choose_food and pearpim

UPDATE auth.users 
SET encrypted_password = crypt('innovation-ai', gen_salt('bf'))
WHERE email IN ('choose_food@internal.system', 'pearpim@internal.system');