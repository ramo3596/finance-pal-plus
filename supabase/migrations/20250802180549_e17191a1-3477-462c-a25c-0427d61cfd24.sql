-- Fix the function to have a proper search path
CREATE OR REPLACE FUNCTION public.update_dashboard_card_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;