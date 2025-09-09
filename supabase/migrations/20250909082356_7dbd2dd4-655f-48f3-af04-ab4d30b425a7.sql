-- Add meal_id column to order table to track which meal an order belongs to
ALTER TABLE public.order 
ADD COLUMN meal_id uuid;

-- Add foreign key constraint to reference meal table
ALTER TABLE public.order 
ADD CONSTRAINT fk_order_meal 
FOREIGN KEY (meal_id) REFERENCES public.meal(meal_id);