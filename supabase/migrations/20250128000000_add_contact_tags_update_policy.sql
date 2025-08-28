-- Add UPDATE policy for contact_tags table to support upsert operations
CREATE POLICY "Users can update contact_tags for own contacts" 
ON public.contact_tags 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM contacts 
  WHERE contacts.id = contact_tags.contact_id 
  AND contacts.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM contacts 
  WHERE contacts.id = contact_tags.contact_id 
  AND contacts.user_id = auth.uid()
));