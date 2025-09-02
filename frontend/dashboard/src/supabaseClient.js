import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nvpknwtppuejrffaswlh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cGtud3RwcHVlanJmZmFzd2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzY0OTAsImV4cCI6MjA3MjE1MjQ5MH0.6acQrRjS5RUXOF9j3TqZ0ikj6oVzA71opR5gIa6NFsQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)