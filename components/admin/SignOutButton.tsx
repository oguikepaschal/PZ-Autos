'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// The default look is for the always-dark desktop header; the phone account
// sheet passes its own row styling.
export function SignOutButton({
  className = '-mr-3 min-h-11 px-3 font-body text-sm text-text-on-dark hover:text-white transition-colors',
}: {
  className?: string
}) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={className}
    >
      Sign out
    </button>
  )
}
