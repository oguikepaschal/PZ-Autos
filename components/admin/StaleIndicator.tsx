import { getFreshnessTier, formatRelativeDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// Admin-only signal — never filters the public listing (see the schema
// migration's note on last_verified_at). Deliberately never red: stale is a
// ring and overdue a solid dot, both in ink, and a fresh car shows when it
// was last checked in muted text.
export function StaleIndicator({ lastVerifiedAt }: { lastVerifiedAt: string }) {
  const tier = getFreshnessTier(lastVerifiedAt)

  if (tier === 'fresh') {
    return (
      // Rendered on the server and again in the phone list on the client; a
      // relative time can cross a boundary ("1 minute ago") between the two.
      <span suppressHydrationWarning className="font-body text-[13px] text-text-muted">
        Verified {formatRelativeDate(lastVerifiedAt)}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-ink"
      title={`Last verified ${formatRelativeDate(lastVerifiedAt)}`}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', tier === 'critical' ? 'bg-ink' : 'border-[1.5px] border-ink')}
      />
      {tier === 'critical' ? 'Overdue' : 'Needs re-check'}
    </span>
  )
}
