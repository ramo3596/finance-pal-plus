-- Add display_order column to templates table
ALTER TABLE public.templates 
ADD COLUMN display_order integer DEFAULT 0;