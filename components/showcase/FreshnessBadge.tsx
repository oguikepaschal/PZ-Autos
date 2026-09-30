import { getFreshnessTier, formatRelativeDate } from '@/lib/formatters'

// Public-facing evidence for the "verified before listing" trust story.
// Renders only when genuinely fresh — never a freshness claim that isn't
// true, and never in a stale/critical state (that's an admin-only signal,
// see components/admin/StaleIndicator.tsx).
export function FreshnessBadge({ lastVerifiedAt }: { lastVerifiedAt: string }) {
  const tier = getFreshnessTier(lastVerifiedAt)
  if (tier !== 'fresh') return null

  return (
    <p className="font-body text-small text-text-muted">
      Verified {formatRelativeDate(lastVerifiedAt)}
    </p>
  )
}
