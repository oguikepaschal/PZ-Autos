import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { StaleIndicator } from '@/components/admin/StaleIndicator'
import {
  setCarFeatured,
  moveFeaturedUp,
  moveFeaturedDown,
  markVerified,
  updateCarStatus,
} from '@/app/admin/actions'
import { cn } from '@/lib/utils'

interface CarRowActionsProps {
  car: {
    id: string
    status: string
    is_featured: boolean
    last_verified_at: string
  }
  hasPhoto: boolean
  // Position of this car in the featured order (-1 when not featured) and the
  // size of that order, so the reorder arrows know when they're at an end.
  featuredIndex: number
  featuredCount: number
  section: 'verified' | 'featured' | 'status'
}

// The one place the inventory's row actions live. The phone cards and the
// desktop table rows both render these sections from the same car data, so a
// change to an action can't land in one layout and miss the other. Every
// control is a 44px hit area; the visible text and switch keep their size.
const linkClass =
  'inline-flex min-h-11 items-center px-1 font-body text-xs text-text-muted hover:text-ink underline'
const iconButtonClass =
  'inline-flex size-11 items-center justify-center rounded text-text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed'

export function CarRowActions({
  car,
  hasPhoto,
  featuredIndex,
  featuredCount,
  section,
}: CarRowActionsProps) {
  const canFeature = ['available', 'reserved'].includes(car.status)
  const isDraft = car.status === 'draft'

  if (section === 'verified') {
    return (
      <div className="flex items-center gap-2">
        <StaleIndicator lastVerifiedAt={car.last_verified_at} />
        <form action={markVerified.bind(null, car.id)}>
          <button type="submit" className={linkClass}>
            Mark verified
          </button>
        </form>
      </div>
    )
  }

  if (section === 'featured') {
    if (isDraft) return null
    const disabled = !car.is_featured && !canFeature

    return (
      <div className="flex items-center">
        <form action={setCarFeatured.bind(null, car.id, !car.is_featured)}>
          <button
            type="submit"
            role="switch"
            aria-checked={car.is_featured}
            disabled={disabled}
            aria-label={car.is_featured ? 'Remove from featured' : 'Add to featured'}
            className="inline-flex size-11 items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full motion-safe:transition-colors',
                car.is_featured ? 'bg-signal-red' : 'bg-hairline'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm motion-safe:transition-transform',
                  car.is_featured ? 'translate-x-[18px]' : 'translate-x-1'
                )}
              />
            </span>
          </button>
        </form>
        {disabled && (
          <span className="font-body text-xs text-text-muted">
            Only available or reserved cars can be featured
          </span>
        )}
        {car.is_featured && (
          <>
            <span className="font-body text-[10px] font-semibold text-text-muted tabular-nums w-4 text-center">
              {featuredIndex + 1}
            </span>
            <form action={moveFeaturedUp.bind(null, car.id)}>
              <button
                type="submit"
                aria-label="Move up"
                disabled={featuredIndex === 0}
                className={iconButtonClass}
              >
                <ChevronUp size={14} />
              </button>
            </form>
            <form action={moveFeaturedDown.bind(null, car.id)}>
              <button
                type="submit"
                aria-label="Move down"
                disabled={featuredIndex === featuredCount - 1}
                className={iconButtonClass}
              >
                <ChevronDown size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 whitespace-nowrap">
      {/* The explicit undefined fills archiveReason so the form's
          FormData argument lands past it instead of in it. */}
      {isDraft ? (
        hasPhoto ? (
          <form action={updateCarStatus.bind(null, car.id, 'available', undefined)}>
            <button type="submit" className={linkClass}>
              Publish
            </button>
          </form>
        ) : (
          <Link href={`/admin/inventory/${car.id}/edit`} className={linkClass}>
            Add a photo to publish
          </Link>
        )
      ) : (
        <>
          {car.status === 'available' && (
            <form action={updateCarStatus.bind(null, car.id, 'reserved', undefined)}>
              <button type="submit" className={linkClass}>
                Reserve
              </button>
            </form>
          )}
          <form action={updateCarStatus.bind(null, car.id, 'sold', undefined)}>
            <button type="submit" className={linkClass}>
              Mark sold
            </button>
          </form>
          <form action={updateCarStatus.bind(null, car.id, 'withdrawn', undefined)}>
            <button type="submit" className={linkClass}>
              Withdraw
            </button>
          </form>
        </>
      )}
      <Link
        href={`/admin/inventory/${car.id}/edit`}
        className="inline-flex min-h-11 items-center px-2 font-body text-sm font-semibold text-ink hover:underline"
      >
        Edit
      </Link>
    </div>
  )
}
