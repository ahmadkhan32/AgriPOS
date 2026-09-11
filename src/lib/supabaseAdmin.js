import { createClient } from '@supabase/supabase-js'

let _supabaseAdmin = null

/**
 * Returns a Supabase admin client using the service role key.
 * Lazy-initialized so the build does not crash when env vars are
 * not available at bundle time (e.g. Vercel build phase).
 */
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add them to .env.local and Vercel environment variables.'
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
