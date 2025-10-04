-- Add columns to transactions table to track scheduled payment confirmations
ALTER TABLE public.transactions 
ADD COLUMN scheduled_payment_id uuid REFERENCES public.scheduled_payments(id) ON DELETE SET NULL,
ADD COLUMN scheduled_occurrence_date timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_transactions_scheduled_payment ON public.transactions(scheduled_payment_id, scheduled_occurrence_date);