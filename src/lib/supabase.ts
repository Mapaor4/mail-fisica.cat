import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to create the emails table if needed
// Run this SQL in your Supabase SQL editor:
/*
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  html_body TEXT,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('incoming', 'outgoing')),
  attachments JSONB
);

CREATE INDEX idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX idx_emails_type ON emails(type);
CREATE INDEX idx_emails_is_read ON emails(is_read);
*/
