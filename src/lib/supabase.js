import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnufdmztxgiruoufhqbh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudWZkbXp0eGdpcnVvdWZocWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTMwODIsImV4cCI6MjEwMjY4OTA4Mn0.M4Q4dytsGXkQ39L5qi9OogCn3ep2SULHZMTCgh7ds_Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})