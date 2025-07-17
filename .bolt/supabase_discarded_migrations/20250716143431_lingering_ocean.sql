/*
  # Create storage buckets for ReviuCar

  1. Storage Buckets
    - `fotos` - Para armazenar fotos dos veículos enviadas pelos usuários
    - `laudos` - Para armazenar os laudos técnicos gerados em PDF
  
  2. Security
    - Políticas RLS para controlar acesso aos arquivos
    - Usuários podem fazer upload de fotos
    - Laudos são acessíveis apenas pelo sistema
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('fotos', 'fotos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('laudos', 'laudos', false, 5242880, ARRAY['text/plain', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading photos to 'fotos' bucket
CREATE POLICY "Allow photo uploads to fotos bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fotos');

-- Policy for reading photos from 'fotos' bucket (for signed URLs)
CREATE POLICY "Allow reading photos from fotos bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fotos');

-- Policy for service role to manage laudos
CREATE POLICY "Service role can manage laudos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'laudos');

-- Policy for authenticated users to read their own laudos
CREATE POLICY "Users can read laudos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'laudos');