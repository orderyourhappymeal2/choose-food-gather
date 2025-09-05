-- Enable RLS on plan table (if not already enabled)
ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;

-- Create policies for plan table to allow public access
-- Since this is an admin function and no authentication is mentioned, allow all operations
CREATE POLICY "Allow all operations on plan" ON public.plan
FOR ALL USING (true) WITH CHECK (true);