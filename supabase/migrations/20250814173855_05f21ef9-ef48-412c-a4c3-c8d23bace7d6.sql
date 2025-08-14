-- Add subcategory_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN subcategory_id uuid REFERENCES subcategories(id);