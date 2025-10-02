-- Add subcategory_id column to scheduled_payments table
ALTER TABLE public.scheduled_payments 
ADD COLUMN subcategory_id uuid REFERENCES public.subcategories(id);