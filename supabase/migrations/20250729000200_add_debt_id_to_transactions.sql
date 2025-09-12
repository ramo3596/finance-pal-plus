-- Add debt_id column to transactions table to link transactions to specific debts
ALTER TABLE transactions ADD COLUMN debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

-- Create index for better performance when querying by debt_id
CREATE INDEX idx_transactions_debt_id ON transactions(debt_id);

-- Add comment to explain the purpose
COMMENT ON COLUMN transactions.debt_id IS 'Links transaction to a specific debt record';