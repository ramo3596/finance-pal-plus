-- Add account_id column to debt_payments table
ALTER TABLE public.debt_payments 
ADD COLUMN account_id uuid;

-- Create index for better performance
CREATE INDEX idx_debt_payments_account_id ON public.debt_payments(account_id);