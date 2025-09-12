-- Add account_id column to debt_payments table
ALTER TABLE debt_payments 
ADD COLUMN account_id UUID REFERENCES accounts(id);

-- Add index for better performance
CREATE INDEX idx_debt_payments_account_id ON debt_payments(account_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN debt_payments.account_id IS 'Optional account ID for the payment transaction. If null, uses the debt original account.';