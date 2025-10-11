import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfddgywmqdkunzafshpc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGRneXdtcWRrdW56YWZzaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjY4ODgsImV4cCI6MjA3NTc0Mjg4OH0.HoU9cdZP6PCv1pgbDEEI1mqBlhIUXBgZyMBfrCVDT1w'

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)