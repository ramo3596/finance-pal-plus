-- Add payment_method_id and order column to accounts, categories, and tags tables
ALTER TABLE public.accounts ADD COLUMN payment_method_id TEXT;
ALTER TABLE public.accounts ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE public.tags ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create indexes for better performance on ordering
CREATE INDEX idx_accounts_display_order ON public.accounts(user_id, display_order);
CREATE INDEX idx_categories_display_order ON public.categories(user_id, display_order);
CREATE INDEX idx_tags_display_order ON public.tags(user_id, display_order);