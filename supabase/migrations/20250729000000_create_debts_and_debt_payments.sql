-- Create debts table to manage debts and loans
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  account_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debt', 'loan')), -- 'debt' = I owe, 'loan' = they owe me
  description TEXT NOT NULL,
  initial_amount NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  debt_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Create policies for debts
CREATE POLICY "Users can view their own debts" 
ON public.debts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debts" 
ON public.debts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts" 
ON public.debts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts" 
ON public.debts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create debt_payments table to track individual payments/transactions
CREATE TABLE public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL,
  transaction_id UUID,
  amount NUMERIC NOT NULL, -- positive for payments, negative for increases
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for debt_payments
CREATE POLICY "Users can view payments for their own debts" 
ON public.debt_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.debts 
  WHERE debts.id = debt_payments.debt_id 
  AND debts.user_id = auth.uid()
));

CREATE POLICY "Users can create payments for their own debts" 
ON public.debt_payments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.debts 
  WHERE debts.id = debt_payments.debt_id 
  AND debts.user_id = auth.uid()
));

CREATE POLICY "Users can update payments for their own debts" 
ON public.debt_payments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.debts 
  WHERE debts.id = debt_payments.debt_id 
  AND debts.user_id = auth.uid()
));

CREATE POLICY "Users can delete payments for their own debts" 
ON public.debt_payments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.debts 
  WHERE debts.id = debt_payments.debt_id 
  AND debts.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.debts 
ADD CONSTRAINT debts_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.debts 
ADD CONSTRAINT debts_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

ALTER TABLE public.debt_payments 
ADD CONSTRAINT debt_payments_debt_id_fkey 
FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE CASCADE;