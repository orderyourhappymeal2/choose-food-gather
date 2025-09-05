-- Create shop storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shop', 'shop', true);

-- Create RLS policies for shop bucket
CREATE POLICY "Anyone can view shop images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'shop');

CREATE POLICY "Anyone can upload shop images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'shop');

CREATE POLICY "Anyone can update shop images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'shop');

CREATE POLICY "Anyone can delete shop images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'shop');