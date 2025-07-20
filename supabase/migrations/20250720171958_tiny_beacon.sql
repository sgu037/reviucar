/*
  # Add images column to analises table

  1. Changes
    - Add `imagens` column to store array of image URLs
    - This will store the paths/URLs of uploaded photos for each analysis

  2. Security
    - No changes to existing RLS policies needed
*/

ALTER TABLE analises ADD COLUMN IF NOT EXISTS imagens text[];

-- Add comment to document the column
COMMENT ON COLUMN analises.imagens IS 'Array of image URLs/paths from Supabase Storage';