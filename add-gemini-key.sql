-- Add Gemini API Key column to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
