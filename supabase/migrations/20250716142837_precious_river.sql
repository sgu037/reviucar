/*
  # Create storage buckets for ReviuCar

  1. Storage Buckets
    - `fotos` - Para armazenar fotos dos veículos
    - `laudos` - Para armazenar laudos técnicos em PDF
  
  2. Security
    - Políticas de acesso público para leitura
    - Políticas de upload para usuários autenticados
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('fotos', 'fotos', true),
  ('laudos', 'laudos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for fotos bucket
CREATE POLICY "Public can view fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');

CREATE POLICY "Anyone can upload fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "Anyone can update fotos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fotos');

CREATE POLICY "Anyone can delete fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fotos');

-- Policies for laudos bucket  
CREATE POLICY "Public can view laudos" ON storage.objects
  FOR SELECT USING (bucket_id = 'laudos');

CREATE POLICY "Anyone can upload laudos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'laudos');

CREATE POLICY "Anyone can update laudos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'laudos');

CREATE POLICY "Anyone can delete laudos" ON storage.objects
  FOR DELETE USING (bucket_id = 'laudos');