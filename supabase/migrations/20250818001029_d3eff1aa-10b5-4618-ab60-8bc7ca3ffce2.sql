-- Update check constraint on categories table to allow proper nature values
-- First drop the existing constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_nature_check;

-- Add new constraint that allows the correct values
ALTER TABLE categories ADD CONSTRAINT categories_nature_check 
CHECK (nature IN ('Necesitar', 'Deseos', 'Deber'));