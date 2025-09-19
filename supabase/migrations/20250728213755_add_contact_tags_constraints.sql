-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('persona', 'empresa')),
  name TEXT NOT NULL,
  image_url TEXT,
  address TEXT,
  identification_number TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  website TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create contact_tags junction table
CREATE TABLE public.contact_tags (
  contact_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  PRIMARY KEY (contact_id, tag_id)
);

-- Enable RLS for contact_tags
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_tags
CREATE POLICY "Users can view contact_tags for own contacts" 
ON public.contact_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM contacts 
  WHERE contacts.id = contact_tags.contact_id 
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Users can create contact_tags for own contacts" 
ON public.contact_tags 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM contacts 
  WHERE contacts.id = contact_tags.contact_id 
  AND contacts.user_id = auth.uid()
));

CREATE POLICY "Users can delete contact_tags for own contacts" 
ON public.contact_tags 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM contacts 
  WHERE contacts.id = contact_tags.contact_id 
  AND contacts.user_id = auth.uid()
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add beneficiary and payer columns to transactions for contact tracking
ALTER TABLE public.transactions 
ADD COLUMN contact_id UUID,
ADD COLUMN payer_contact_id UUID;