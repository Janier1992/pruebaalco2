// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://iflroysfsuoceemyrtqi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucHhoaGp0bmJpZGpxdmhwc25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNDgyMDMsImV4cCI6MjA2NzkyNDIwM30.stXP4l6OX4-AymYQMIR2ncxnX_nDN7puQicOxVjMu-Q'

export const supabase = createClient(supabaseUrl, supabaseKey)
