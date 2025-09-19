-- Fix the security warnings by adding search_path parameter to functions
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Update the main account balance
    UPDATE accounts 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.account_id;
    
    -- For transfers, also update the destination account if it exists
    IF NEW.to_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.to_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction impact
    UPDATE accounts 
    SET balance = balance - OLD.amount 
    WHERE id = OLD.account_id;
    
    IF OLD.to_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance + OLD.amount 
      WHERE id = OLD.to_account_id;
    END IF;
    
    -- Apply new transaction impact
    UPDATE accounts 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.account_id;
    
    IF NEW.to_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.to_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Revert transaction impact
    UPDATE accounts 
    SET balance = balance - OLD.amount 
    WHERE id = OLD.account_id;
    
    IF OLD.to_account_id IS NOT NULL THEN
      UPDATE accounts 
      SET balance = balance + OLD.amount 
      WHERE id = OLD.to_account_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to automatically update account balances
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Fix the other function search_path warnings too
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;