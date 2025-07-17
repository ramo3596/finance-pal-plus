
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  nature TEXT NOT NULL CHECK (nature IN ('Necesitar', 'Deseos', 'Deber')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  payment_method TEXT,
  type TEXT NOT NULL CHECK (type IN ('Gastos', 'Ingresos', 'Transferencias')),
  beneficiary TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_tags junction table
CREATE TABLE public.template_tags (
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, tag_id)
);

-- Create filters table
CREATE TABLE public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Todos',
  transfers TEXT DEFAULT 'Excluir',
  debts TEXT DEFAULT 'Excluir',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filter_categories junction table
CREATE TABLE public.filter_categories (
  filter_id UUID REFERENCES public.filters(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (filter_id, category_id)
);

-- Create filter_tags junction table
CREATE TABLE public.filter_tags (
  filter_id UUID REFERENCES public.filters(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (filter_id, tag_id)
);

-- Create user_settings table for notifications
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wallet_reminder BOOLEAN DEFAULT true,
  scheduled_payments BOOLEAN DEFAULT true,
  debts BOOLEAN DEFAULT true,
  income BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for subcategories
CREATE POLICY "Users can view subcategories of own categories" ON public.subcategories FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.categories WHERE categories.id = subcategories.category_id AND categories.user_id = auth.uid()));
CREATE POLICY "Users can create subcategories for own categories" ON public.subcategories FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.categories WHERE categories.id = subcategories.category_id AND categories.user_id = auth.uid()));
CREATE POLICY "Users can update subcategories of own categories" ON public.subcategories FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.categories WHERE categories.id = subcategories.category_id AND categories.user_id = auth.uid()));
CREATE POLICY "Users can delete subcategories of own categories" ON public.subcategories FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.categories WHERE categories.id = subcategories.category_id AND categories.user_id = auth.uid()));

-- Create RLS policies for tags
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for templates
CREATE POLICY "Users can view own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for template_tags
CREATE POLICY "Users can view template_tags for own templates" ON public.template_tags FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.templates WHERE templates.id = template_tags.template_id AND templates.user_id = auth.uid()));
CREATE POLICY "Users can create template_tags for own templates" ON public.template_tags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.templates WHERE templates.id = template_tags.template_id AND templates.user_id = auth.uid()));
CREATE POLICY "Users can delete template_tags for own templates" ON public.template_tags FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.templates WHERE templates.id = template_tags.template_id AND templates.user_id = auth.uid()));

-- Create RLS policies for filters
CREATE POLICY "Users can view own filters" ON public.filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own filters" ON public.filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filters" ON public.filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own filters" ON public.filters FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for filter_categories
CREATE POLICY "Users can view filter_categories for own filters" ON public.filter_categories FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_categories.filter_id AND filters.user_id = auth.uid()));
CREATE POLICY "Users can create filter_categories for own filters" ON public.filter_categories FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_categories.filter_id AND filters.user_id = auth.uid()));
CREATE POLICY "Users can delete filter_categories for own filters" ON public.filter_categories FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_categories.filter_id AND filters.user_id = auth.uid()));

-- Create RLS policies for filter_tags
CREATE POLICY "Users can view filter_tags for own filters" ON public.filter_tags FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_tags.filter_id AND filters.user_id = auth.uid()));
CREATE POLICY "Users can create filter_tags for own filters" ON public.filter_tags FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_tags.filter_id AND filters.user_id = auth.uid()));
CREATE POLICY "Users can delete filter_tags for own filters" ON public.filter_tags FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.filters WHERE filters.id = filter_tags.filter_id AND filters.user_id = auth.uid()));

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
