-- Create scheduled_payment_confirmations table
CREATE TABLE scheduled_payment_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduled_payment_id UUID NOT NULL REFERENCES scheduled_payments(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'postponed', 'rejected')),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate confirmations for the same occurrence
CREATE UNIQUE INDEX idx_scheduled_payment_confirmations_unique 
ON scheduled_payment_confirmations(scheduled_payment_id, occurrence_date);

-- Create index for faster queries by user
CREATE INDEX idx_scheduled_payment_confirmations_user_id 
ON scheduled_payment_confirmations(user_id);

-- Create index for faster queries by status
CREATE INDEX idx_scheduled_payment_confirmations_status 
ON scheduled_payment_confirmations(status);

-- Enable RLS
ALTER TABLE scheduled_payment_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own confirmations
CREATE POLICY "Users can view their own payment confirmations" 
ON scheduled_payment_confirmations FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own confirmations
CREATE POLICY "Users can insert their own payment confirmations" 
ON scheduled_payment_confirmations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own confirmations
CREATE POLICY "Users can update their own payment confirmations" 
ON scheduled_payment_confirmations FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own confirmations
CREATE POLICY "Users can delete their own payment confirmations" 
ON scheduled_payment_confirmations FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON scheduled_payment_confirmations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_payment_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_scheduled_payment_confirmations_updated_at
    BEFORE UPDATE ON scheduled_payment_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_payment_confirmations_updated_at();