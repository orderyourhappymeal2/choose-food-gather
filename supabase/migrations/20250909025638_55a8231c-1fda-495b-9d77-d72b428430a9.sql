-- Update meal table structure to match requirements
ALTER TABLE public.meal 
DROP COLUMN IF EXISTS meal_time,
DROP COLUMN IF EXISTS meal_type;

-- Add meal_index column if it doesn't exist
ALTER TABLE public.meal 
ADD COLUMN IF NOT EXISTS meal_index bigint NOT NULL DEFAULT 1;

-- Make shop_id nullable since user can choose to let participants select their own
ALTER TABLE public.meal 
ALTER COLUMN shop_id DROP NOT NULL;