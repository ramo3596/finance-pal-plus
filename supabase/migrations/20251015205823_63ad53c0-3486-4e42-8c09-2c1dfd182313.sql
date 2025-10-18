-- Add webhook_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN webhook_url text DEFAULT 'https://n8n1.avfservicios.site/webhook/b49538ed-b1bd-4be4-be13-4d9e7da516a4';