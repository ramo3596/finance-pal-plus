-- Create scheduled_payments table
CREATE TABLE public.scheduled_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id UUID,
  account_id UUID,
  to_account_id UUID, -- For transfers
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  contact_id UUID,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('once', 'recurring')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_days INTEGER DEFAULT 0, -- 0=none, 1=due_date, 2=one_day, 3=three_days, 7=one_week
  -- Recurring payment fields
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  recurrence_interval INTEGER DEFAULT 1, -- Every X days/weeks/months/years
  recurrence_day_option TEXT, -- 'same_day', 'first_monday', etc.
  end_type TEXT CHECK (end_type IN ('never', 'date', 'count')),
  end_date TIMESTAMP WITH TIME ZONE,
  end_count INTEGER,
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scheduled payments" 
ON public.scheduled_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled payments" 
ON public.scheduled_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled payments" 
ON public.scheduled_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled payments" 
ON public.scheduled_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_payments_updated_at
BEFORE UPDATE ON public.scheduled_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();