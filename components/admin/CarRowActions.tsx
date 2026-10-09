'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { StaleIndicator } from '@/components/admin/StaleIndicator'
import { SaveStatus, useInstantSave } from '@/components/admin/useInstantSave'
import { sheetRowClass } from '@/components/admin/ActionSheet'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { announceCarDeleted } from '@/components/admin/CarDeletedNotice'
import {
  setCarFeatured,
  moveFeaturedUp,
  moveFeaturedDown,
  markVerified,
  updateCarStatus,
  deleteCar,
} from '@/app/admin/actions'
import { cn } from '@/lib/utils'

interface RowCar {
  id: string
  status: string
  is_featured: boolean
  last_verified_at: string
}

interface CarRowActionsProps {
  car: RowCar
  hasPhoto: boolean
  // Position of this car in the featured order (-1 when not featured) and the
  // size of that order, so the reorder arrows know when they're at an end.
  featuredIndex: number
  featuredCount: number
  section: 'verified' | 'featured' | 'status'
  // "year make model", for the delete confirmation. The status section shows
  // Delete only when it is given.
  title?: string
  // 'sheet' renders the status actions as full-width rows for the phone's
  // More sheet; 'inline' is the desktop table cell.
  variant?: 'inline' | 'sheet'
  // Called once a status action has saved, so the sheet can close.
  onDone?: () => void
}

// The one place the inventory's row actions live. The phone cards (and their
// More sheet), the desktop table rows and the edit screen all render these
// from the same car data, so a change to an action can't land in one layout
// and miss the other. Every control is a 44px hit area. Each instant save
// confirms itself with a brief "Saved".
const inlineLinkClass =
  'inline-flex min-h-11 items-center px-1 font-body text-sm text-text-muted hover:text-ink underline'
const iconButtonClass =
  'inline-flex size-11 items-center justify-center rounded-full text-ink active:bg-fill disabled:opacity-30 disabled:cursor-not-allowed'

export function CarRowActions(props: CarRowActionsProps) {
  if (props.section === 'verified') return <VerifiedAction car={props.car} />
  if (props.section === 'featured') {
    if (props.car.status === 'draft') return null
    return (
      <div className="flex items-center">
        <FeaturedSwitch car={props.car} />
        {props.car.is_featured && (
          <PositionArrows car={props.car} featuredIndex={props.featuredIndex} featuredCount={props.featuredCount} />
        )}
      </div>
    )
  }
  return <StatusActions {...props} />
}

function VerifiedAction({ car }: { car: RowCar }) {
  const { state, run, pending } = useInstantSave()
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <StaleIndicator lastVerifiedAt={car.last_verified_at} />
      <div className="flex items-center gap-2">
        <SaveStatus state={state} />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markVerified(car.id))}
          className="inline-flex h-11 shrink-0 items-center rounded-full border border-hairline px-3.5 font-body text-sm font-semibold text-ink active:bg-fill disabled:opacity-60"
        >
          Mark verified
        </button>
      </div>
    </div>
  )
}

// The red switch is one of the few places signal red is allowed.
export function FeaturedSwitch({ car, label }: { car: RowCar; label?: string }) {
  const { state, run, pending } = useInstantSave()
  // The switch shows where it is going from the tap until the refreshed car
  // arrives with that value (or the save fails), so it never flickers back.
  const [target, setTarget] = useState<boolean | null>(null)
  if (target !== null && (target === car.is_featured || state === 'error')) setTarget(null)
  const canFeature = ['available', 'reserved'].includes(car.status)
  const disabled = (!car.is_featured && !canFeature) || pending
  const on = target ?? car.is_featured

  return (
    <div className="flex items-center gap-2">
      <SaveStatus state={state} />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        aria-label={label ?? (car.is_featured ? 'Remove from featured' : 'Add to featured')}
        onClick={() => {
          setTarget(!car.is_featured)
          run(() => setCarFeatured(car.id, !car.is_featured))
        }}
        className="inline-flex h-11 w-[52px] shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          className={cn(
            'relative block h-[31px] w-[51px] rounded-full transition-colors duration-200 motion-reduce:transition-none',
            // The off track uses text-muted for 3:1 against the card.
            on ? 'bg-signal-red' : 'bg-text-muted'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 block size-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-200',
              on && 'translate-x-5'
            )}
          />
        </span>
      </button>
      {!car.is_featured && !canFeature && (
        <span className="font-body text-xs text-text-muted">Only available or reserved cars can be featured</span>
      )}
    </div>
  )
}

export function PositionArrows({
  car,
  featuredIndex,
  featuredCount,
}: {
  car: RowCar
  featuredIndex: number
  featuredCount: number
}) {
  const { state, run, pending } = useInstantSave()
  return (
    <div className="flex items-center gap-1">
      <SaveStatus state={state} />
      <button
        type="button"
        aria-label="Move up"
        disabled={featuredIndex === 0 || pending}
        onClick={() => run(() => moveFeaturedUp(car.id))}
        className={iconButtonClass}
      >
        <ChevronUp size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <span className="min-w-7 text-center font-display text-base font-bold tabular-nums" aria-label={`Position ${featuredIndex + 1}`}>
        {featuredIndex + 1}
      </span>
      <button
        type="button"
        aria-label="Move down"
        disabled={featuredIndex === featuredCount - 1 || pending}
        onClick={() => run(() => moveFeaturedDown(car.id))}
        className={iconButtonClass}
      >
        <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  )
}

// The archive's one action. Same instant save as the inventory's status
// buttons, so a failed restore says so instead of failing silently.
export function RestoreAction({ carId }: { carId: string }) {
  const { state, run, pending } = useInstantSave()
  return (
    <>
      <SaveStatus state={state} />
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => updateCarStatus(carId, 'available', undefined))}
        className={cn(inlineLinkClass, 'text-xs disabled:opacity-60')}
      >
        Restore
      </button>
    </>
  )
}

// Hard delete behind a confirmation. Withdraw is the way to hide a car and
// keep its history, so the dialog points there.
export function DeleteCarAction({
  carId,
  title,
  className,
  onDeleted,
}: {
  carId: string
  title: string
  className?: string
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'deleting' | 'error'>('idle')

  async function confirm() {
    setPhase('deleting')
    try {
      const result = await deleteCar(carId)
      if (!result.ok) {
        setPhase('error')
        return
      }
    } catch {
      setPhase('error')
      return
    }
    setOpen(false)
    setPhase('idle')
    announceCarDeleted()
    onDeleted?.()
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPhase('idle')
          setOpen(true)
        }}
        className={className}
      >
        Delete
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title={`Delete ${title}?`}
        description="This removes the car, its photos and its tap history. This can't be undone."
        hint="To hide it but keep its history, use Withdraw."
        confirmLabel="Delete"
        pending={phase === 'deleting'}
        error={phase === 'error' ? "Couldn't delete this car. Try again." : null}
      />
    </>
  )
}

function StatusActions({ car, hasPhoto, title, variant = 'inline', onDone }: CarRowActionsProps) {
  const { state, run, pending } = useInstantSave()
  const sheet = variant === 'sheet'
  const editHref = `/admin/inventory/${car.id}/edit`

  // The explicit undefined fills archiveReason, which these quick actions
  // never set.
  const actions: { label: string; status: 'available' | 'reserved' | 'sold' | 'withdrawn' }[] =
    car.status === 'draft'
      ? hasPhoto
        ? [{ label: 'Publish', status: 'available' }]
        : []
      : [
          ...(car.status === 'available' ? [{ label: 'Reserve', status: 'reserved' as const }] : []),
          { label: 'Mark sold', status: 'sold' },
          { label: 'Withdraw', status: 'withdrawn' },
        ]

  const buttons = actions.map(({ label, status }) => (
    <button
      key={status}
      type="button"
      disabled={pending}
      onClick={() => run(() => updateCarStatus(car.id, status, undefined), onDone)}
      className={sheet ? sheetRowClass : inlineLinkClass}
    >
      {label}
    </button>
  ))

  const needsPhoto = car.status === 'draft' && !hasPhoto

  if (sheet) {
    return (
      <>
        {buttons}
        {needsPhoto && (
          <Link href={editHref} className={sheetRowClass}>
            Add a photo to publish
          </Link>
        )}
        {title && (
          <div className="border-t-[6px] border-fill">
            <DeleteCarAction
              carId={car.id}
              title={title}
              onDeleted={onDone}
              className={cn(sheetRowClass, 'font-semibold text-signal-red')}
            />
          </div>
        )}
        <div
          className={
            state === 'error' ? 'flex min-h-11 items-center justify-center border-t border-hairline' : 'sr-only'
          }
        >
          <SaveStatus state={state} />
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 whitespace-nowrap">
      <SaveStatus state={state} />
      {buttons}
      {needsPhoto && (
        <Link href={editHref} className={inlineLinkClass}>
          Add a photo to publish
        </Link>
      )}
      <Link
        href={editHref}
        className="inline-flex min-h-11 items-center px-2 font-body text-sm font-semibold text-ink hover:underline"
      >
        Edit
      </Link>
      {title && (
        <DeleteCarAction carId={car.id} title={title} className={cn(inlineLinkClass, 'text-signal-red no-underline')} />
      )}
    </div>
  )
}
