-- Create analises table
CREATE TABLE public.analises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  placa TEXT NOT NULL,
  modelo TEXT NOT NULL,
  json_laudo JSONB,
  url_pdf TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analises ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own analises" 
ON public.analises 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own analises" 
ON public.analises 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own analises" 
ON public.analises 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own analises" 
ON public.analises 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analises_updated_at
BEFORE UPDATE ON public.analises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('fotos', 'fotos', true),
('laudos', 'laudos', true);

-- Create policies for fotos bucket
CREATE POLICY "Users can view their own fotos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own fotos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own fotos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own fotos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for laudos bucket
CREATE POLICY "Users can view their own laudos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'laudos');

CREATE POLICY "Users can upload laudos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'laudos');

CREATE POLICY "Users can update laudos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'laudos');

CREATE POLICY "Users can delete laudos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'laudos');