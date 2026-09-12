import { createClient } from '@supabase/supabase-js'

let _supabaseAdmin = null

/**
 * Returns a Supabase admin client using the service role key.
 * Lazy-initialized so the build does not crash when env vars are
 * not available at bundle time (e.g. Vercel build phase).
 */
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnufdmztxgiruoufhqbh.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudWZkbXp0eGdpcnVvdWZocWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzExMzA4MiwiZXhwIjoyMTAyNjg5MDgyfQ.xYzD7CCu-B55uxlie5kFP6GwAX48Fp8ltnwsPhzAj6o'

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabaseAdmin
}

// Backwards-compatible named export (lazy getter)
export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop]
  }
})
