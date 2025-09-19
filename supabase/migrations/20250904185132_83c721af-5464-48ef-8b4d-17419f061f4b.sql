-- Add to_account_id field to templates table for transfers
ALTER TABLE public.templates 
ADD COLUMN to_account_id uuid;