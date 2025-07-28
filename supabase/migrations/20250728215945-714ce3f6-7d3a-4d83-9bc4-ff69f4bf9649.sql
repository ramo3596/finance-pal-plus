-- Add foreign key constraints for contact_tags table
ALTER TABLE contact_tags 
ADD CONSTRAINT contact_tags_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE contact_tags 
ADD CONSTRAINT contact_tags_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;