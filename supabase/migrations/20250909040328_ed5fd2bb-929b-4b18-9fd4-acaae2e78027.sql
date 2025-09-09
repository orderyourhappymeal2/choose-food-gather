-- Enable Row Level Security on order and person tables
ALTER TABLE public.order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person ENABLE ROW LEVEL SECURITY;

-- Create policies for order table
CREATE POLICY "Allow all operations on order"
ON public.order
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for person table  
CREATE POLICY "Allow all operations on person"
ON public.person
FOR ALL
USING (true)
WITH CHECK (true);