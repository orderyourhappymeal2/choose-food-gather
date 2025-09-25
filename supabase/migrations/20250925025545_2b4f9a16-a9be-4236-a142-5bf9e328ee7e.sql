-- Simply update passwords for existing auth users
UPDATE auth.users 
SET encrypted_password = crypt('choose_food123', gen_salt('bf'))
WHERE email = 'choose_food@internal.system';

UPDATE auth.users 
SET encrypted_password = crypt('pearpim123', gen_salt('bf'))
WHERE email = 'pearpim@internal.system';