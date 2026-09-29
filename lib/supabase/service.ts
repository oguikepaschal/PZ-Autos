import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client. Bypasses RLS entirely — used only by server-side
// code that must write without an authenticated session (the WhatsApp
// click API route). Never import this from a client component, and never
// from anything that runs in the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
