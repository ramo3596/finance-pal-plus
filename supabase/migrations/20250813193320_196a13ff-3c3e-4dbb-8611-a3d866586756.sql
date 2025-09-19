-- Add missing icon column to subcategories table
ALTER TABLE public.subcategories 
ADD COLUMN icon TEXT DEFAULT '📦' NOT NULL;