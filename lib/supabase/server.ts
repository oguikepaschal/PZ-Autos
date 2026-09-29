import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Server Component / Route Handler / middleware client. Reads the owner's
// session from cookies so RLS sees `authenticated`, same as the browser
// client — this is what lets admin Server Components query cars/suppliers
// directly.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component during render — middleware
            // refreshes the session instead, so this is safe to ignore.
          }
        },
      },
    }
  )
}
