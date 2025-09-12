-- Add display_order column to subcategories table
ALTER TABLE subcategories ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing subcategories with sequential display_order values
WITH ordered_subcategories AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_order
  FROM subcategories
)
UPDATE subcategories 
SET display_order = ordered_subcategories.new_order
FROM ordered_subcategories 
WHERE subcategories.id = ordered_subcategories.id;