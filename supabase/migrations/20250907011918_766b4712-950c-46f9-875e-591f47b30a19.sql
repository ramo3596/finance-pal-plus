-- Change tags column to text array to match the TypeScript interface
ALTER TABLE public.transactions 
ALTER COLUMN tags TYPE text[] USING 
  CASE 
    WHEN tags IS NULL THEN NULL
    WHEN tags = '' THEN '{}'::text[]
    ELSE string_to_array(tags, ',')
  END;