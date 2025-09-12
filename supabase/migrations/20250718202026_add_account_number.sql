-- Add account_number field to accounts table
ALTER TABLE public.accounts 
ADD COLUMN account_number TEXT;