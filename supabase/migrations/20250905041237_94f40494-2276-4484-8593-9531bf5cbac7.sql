-- Add RLS policies for shop table
ALTER TABLE public.shop ENABLE ROW LEVEL SECURITY;

-- Create policies for shop table (allow all operations for now since this is admin interface)
CREATE POLICY "Allow all operations on shop" 
ON public.shop 
FOR ALL 
USING (true) 
WITH CHECK (true);