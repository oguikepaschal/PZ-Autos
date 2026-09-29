import { getFreshnessTier, formatRelativeDate } from '@/lib/formatters'

// Admin-only signal — never filters the public listing (see the schema
// migration's note on last_verified_at). Deliberately never red: the brand
// ratio constraint singles out stale-listing flags as a case that must not
// default to red, so tier 1 is an ink outline and tier 2 a solid ink fill.
export function StaleIndicator({ lastVerifiedAt }: { lastVerifiedAt: string }) {
  const tier = getFreshnessTier(lastVerifiedAt)

  if (tier === 'fresh') return null

  return (
    <span
      className={
        tier === 'critical'
          ? 'inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-ink text-white px-2.5 py-0.5 text-caption font-body font-semibold'
          : 'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-ink text-ink px-2.5 py-0.5 text-caption font-body font-semibold'
      }
      title={`Last verified ${formatRelativeDate(lastVerifiedAt)}`}
    >
      {tier === 'critical' ? 'Critically stale' : 'Needs re-verification'}
    </span>
  )
}
