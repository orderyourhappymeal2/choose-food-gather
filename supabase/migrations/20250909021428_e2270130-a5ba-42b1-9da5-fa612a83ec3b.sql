-- Enable Row Level Security on food table
ALTER TABLE public.food ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations on food table
CREATE POLICY "Allow all operations on food" 
ON public.food 
FOR ALL 
USING (true) 
WITH CHECK (true);