-- Enable RLS on meal table and create policies
ALTER TABLE public.meal ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on meal table
CREATE POLICY "Allow all operations on meal" ON public.meal
FOR ALL USING (true) WITH CHECK (true);