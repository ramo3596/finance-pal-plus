-- First, let's examine the current trigger and fix the balance calculation issue
-- The issue seems to be in the trigger logic for transfers

-- Drop and recreate the trigger function with corrected logic
DROP FUNCTION IF EXISTS public.update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- For transfers, the amount is already correctly calculated in the application
    -- Debit transaction: amount is negative, affects account_id
    -- Credit transaction: amount is positive, affects account_id
    UPDATE accounts 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction impact
    UPDATE accounts 
    SET balance = balance - OLD.amount 
    WHERE id = OLD.account_id;
    
    -- Apply new transaction impact
    UPDATE accounts 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Revert transaction impact
    UPDATE accounts 
    SET balance = balance - OLD.amount 
    WHERE id = OLD.account_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();