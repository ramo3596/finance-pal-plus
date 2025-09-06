-- Add missing subcategory_id column to templates table
ALTER TABLE public.templates 
ADD COLUMN subcategory_id uuid;