import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/showcase/rateLimiter'

// The proxy matcher (proxy.ts) only covers /admin/** and /login — /api/** is
// deliberately outside it so the public card tap endpoint can stay
// unauthenticated. Any admin-only API route therefore has to check the caller
// itself; skipping this leaves the route, and the Anthropic key behind it,
// world-callable.
//
// `scope` keeps each route's rate-limit window separate, so the two
// suggestion features can't starve one another.
//
// Returns a response to send back when the request must be refused, or null
// when the caller should proceed.
export async function refuseUnlessAdmin(scope: string): Promise<NextResponse | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // A session alone isn't enough: is_owner() is the single place the owner's
  // identity lives, the same check every RLS policy uses.
  const { data: isOwner, error: ownerError } = await supabase.rpc('is_owner')
  if (ownerError || isOwner !== true) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  // Keyed on the signed-in user rather than the IP: these routes are only
  // reachable by the owner, so the thing worth capping is a runaway form
  // (a stuck retry loop burning Anthropic spend), not anonymous abuse. Being
  // limited is not an error the admin needs to see — the caller turns it into
  // "no suggestion", same as any other failure.
  if (isRateLimited(`${scope}:${user.id}`)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  return null
}

// For public endpoints that should ignore the owner's own activity (card tap
// counts). Fails open: no session, an auth error or a failed is_owner() call
// all return false, so a real customer's tap is never dropped because of an
// auth hiccup. Signed-out callers have no session cookie, so getUser() returns
// without a network call.
export async function isOwnerRequest(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data: isOwner, error } = await supabase.rpc('is_owner')
    return !error && isOwner === true
  } catch {
    return false
  }
}
