-- Add account_id column to debt_payments table
ALTER TABLE public.debt_payments 
ADD COLUMN account_id uuid;

-- Create index for better performance
CREATE INDEX idx_debt_payments_account_id ON public.debt_payments(account_id);

-- Ensure required categories exist
INSERT INTO public.categories (name, color, icon, nature, user_id) 
SELECT 'Ingresos', '#22c55e', '💵', 'Necesitar', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE name = 'Ingresos' AND nature = 'Necesitar' AND user_id = auth.uid()
);

INSERT INTO public.categories (name, color, icon, nature, user_id) 
SELECT 'Gastos financieros', '#ef4444', '💰', 'Deber', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE name = 'Gastos financieros' AND nature = 'Deber' AND user_id = auth.uid()
);

-- Create subcategories for debt payments
-- First get the income category ID and create loans subcategory
DO $$
DECLARE
    income_category_id uuid;
    expense_category_id uuid;
BEGIN
    -- Get income category ID
    SELECT id INTO income_category_id 
    FROM public.categories 
    WHERE name = 'Ingresos' AND nature = 'Necesitar' 
    LIMIT 1;
    
    -- Get expense category ID  
    SELECT id INTO expense_category_id
    FROM public.categories 
    WHERE name = 'Gastos financieros' AND nature = 'Deber'
    LIMIT 1;
    
    -- Create loans subcategory under income
    IF income_category_id IS NOT NULL THEN
        INSERT INTO public.subcategories (name, icon, category_id)
        SELECT 'Préstamos, alquileres', '🏠', income_category_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.subcategories 
            WHERE name = 'Préstamos, alquileres' AND category_id = income_category_id
        );
    END IF;
    
    -- Create commission subcategory under financial expenses
    IF expense_category_id IS NOT NULL THEN
        INSERT INTO public.subcategories (name, icon, category_id)
        SELECT 'Comisión', '💳', expense_category_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.subcategories 
            WHERE name = 'Comisión' AND category_id = expense_category_id
        );
    END IF;
END $$;