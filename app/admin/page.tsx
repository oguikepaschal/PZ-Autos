import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StaleIndicator } from '@/components/admin/StaleIndicator'
import { formatNGN, formatCarTitle } from '@/lib/formatters'
import {
  setCarFeatured,
  moveFeaturedUp,
  moveFeaturedDown,
  markVerified,
  updateCarStatus,
} from './actions'
import { cn } from '@/lib/utils'
import type { CarWithSupplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type AdminListCar = CarWithSupplier & { car_images: { count: number }[] }

export default async function AdminInventoryPage() {
  const supabase = await createClient()

  const { data: cars, error } = await supabase
    .from('cars')
    .select('*, supplier:suppliers(id, name, supplier_type), whatsapp_clicks(count), car_images(count)')
    .in('status', ['draft', 'available', 'reserved'])
    .order('is_featured', { ascending: false })
    .order('featured_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  const typedCars = (cars ?? []) as unknown as AdminListCar[]
  const featuredIds = typedCars.filter((c) => c.is_featured).map((c) => c.id)
  const featuredCount = featuredIds.length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display font-black text-h3 tracking-display text-ink">Inventory</h1>
        <Link
          href="/admin/inventory/new"
          className="inline-flex h-11 items-center rounded-lg bg-signal-red px-4 font-body font-semibold text-small text-white"
        >
          Add car
        </Link>
      </div>

      {featuredCount > 6 && (
        <p className="font-body text-small text-signal-red mb-4">
          {featuredCount} cars are featured — only the first 6 by order will show on the landing
          page. Unfeature {featuredCount - 6} more.
        </p>
      )}

      {typedCars.length === 0 ? (
        <p className="rounded-lg border border-hairline px-4 py-8 text-center font-body text-body text-text-muted">
          No cars yet.{' '}
          <Link href="/admin/inventory/new" className="underline">
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Below xl: one card per car with every control at 44px, two
              columns on tablets. The 8-column table only fits without
              sideways scrolling from 1280px up. */}
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
            {typedCars.map((car) => {
              const row = rowState(car, featuredIds)
              return (
                <li key={car.id} className="rounded-lg border border-hairline p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-body text-ink">
                        {formatCarTitle(car.make, car.model, car.year)}
                      </p>
                      <p className="mt-1 font-body text-small text-text-muted">
                        {car.supplier?.name ?? 'No supplier'}
                      </p>
                    </div>
                    <p className="shrink-0 font-body font-semibold text-body text-ink tabular-nums">
                      {formatNGN(car.asking_price_ngn)}
                    </p>
                  </div>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-body text-small">
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Status</dt>
                      <dd className="capitalize text-ink">{car.status}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-text-muted">WhatsApp taps</dt>
                      <dd className="text-ink tabular-nums">{car.whatsapp_clicks[0]?.count ?? 0}</dd>
                    </div>
                  </dl>

                  <div className="mt-3">
                    <VerifiedControls car={car} />
                  </div>

                  {!row.isDraft && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-body text-small text-text-muted">Featured</span>
                      <FeaturedControls car={car} row={row} featuredCount={featuredCount} />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
                    <StatusActions car={car} row={row} />
                  </div>
                </li>
              )
            })}
          </ul>

          {/* xl up: the table. Actions wrap inside their cell instead of
              forcing the table wider. */}
          <div className="relative hidden overflow-x-auto rounded-lg border border-hairline xl:block">
            <table className="w-full text-left">
              <thead className="bg-surface">
                <tr>
                  {['Car', 'Supplier', 'Status', 'Price', 'WhatsApp taps', 'Verified', 'Featured'].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-3 py-3 font-body text-caption font-semibold text-text-muted"
                      >
                        {label}
                      </th>
                    )
                  )}
                  <th className="px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {typedCars.map((car) => {
                  const row = rowState(car, featuredIds)
                  return (
                    <tr key={car.id} className="align-middle">
                      <td className="min-w-40 px-3 py-3 font-body text-small text-ink font-semibold">
                        {formatCarTitle(car.make, car.model, car.year)}
                      </td>
                      <td className="px-3 py-3 font-body text-small text-text-muted">
                        {car.supplier?.name ?? '—'}
                      </td>
                      <td className="px-3 py-3 font-body text-small text-ink capitalize">{car.status}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-body text-small text-ink tabular-nums">
                        {formatNGN(car.asking_price_ngn)}
                      </td>
                      <td className="px-3 py-3 font-body text-small text-ink tabular-nums">
                        {car.whatsapp_clicks[0]?.count ?? 0}
                      </td>
                      <td className="px-3 py-3">
                        <VerifiedControls car={car} />
                      </td>
                      <td className="px-3 py-3">
                        {!row.isDraft && (
                          <FeaturedControls car={car} row={row} featuredCount={featuredCount} />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-52 flex-wrap items-center justify-end gap-2">
                          <StatusActions car={car} row={row} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

interface RowState {
  featuredIndex: number
  canFeature: boolean
  isDraft: boolean
  hasPhoto: boolean
}

function rowState(car: AdminListCar, featuredIds: string[]): RowState {
  return {
    featuredIndex: car.is_featured ? featuredIds.indexOf(car.id) : -1,
    canFeature: ['available', 'reserved'].includes(car.status),
    isDraft: car.status === 'draft',
    hasPhoto: (car.car_images[0]?.count ?? 0) > 0,
  }
}

const ACTION_BASE =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-3 font-body text-small transition-colors'
const ACTION = `${ACTION_BASE} border border-hairline text-ink hover:border-text-muted`
const ACTION_PRIMARY = `${ACTION_BASE} bg-ink font-semibold text-white`
const ACTION_LINK = `${ACTION_BASE} text-ink underline underline-offset-4`

function VerifiedControls({ car }: { car: AdminListCar }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StaleIndicator lastVerifiedAt={car.last_verified_at} />
      <form action={markVerified.bind(null, car.id)}>
        <button type="submit" className={ACTION_LINK}>
          Mark verified
        </button>
      </form>
    </div>
  )
}

function FeaturedControls({
  car,
  row,
  featuredCount,
}: {
  car: AdminListCar
  row: RowState
  featuredCount: number
}) {
  return (
    <div className="flex items-center">
      <form action={setCarFeatured.bind(null, car.id, !car.is_featured)}>
        {/* The 44px button is the tap target; the track inside is the visual. */}
        <button
          type="submit"
          role="switch"
          aria-checked={car.is_featured}
          disabled={!car.is_featured && !row.canFeature}
          aria-label={car.is_featured ? 'Remove from featured' : 'Add to featured'}
          title={
            car.is_featured
              ? 'Featured — click to remove'
              : row.canFeature
                ? 'Click to feature on the landing page'
                : 'Only available/reserved cars can be featured'
          }
          className="group flex h-11 w-12 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
              car.is_featured ? 'bg-signal-red' : 'bg-hairline'
            )}
          >
            <span
              className={cn(
                'inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform',
                car.is_featured ? 'translate-x-4.5' : 'translate-x-1'
              )}
            />
          </span>
        </button>
      </form>
      {car.is_featured && (
        <>
          <span className="w-6 text-center font-body text-caption font-semibold text-text-muted tabular-nums">
            {row.featuredIndex + 1}
          </span>
          <form action={moveFeaturedUp.bind(null, car.id)}>
            <button
              type="submit"
              aria-label="Move up"
              disabled={row.featuredIndex === 0}
              className="flex size-11 items-center justify-center rounded-lg text-text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronUp size={18} />
            </button>
          </form>
          <form action={moveFeaturedDown.bind(null, car.id)}>
            <button
              type="submit"
              aria-label="Move down"
              disabled={row.featuredIndex === featuredCount - 1}
              className="flex size-11 items-center justify-center rounded-lg text-text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronDown size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// The explicit undefined fills archiveReason so the form's FormData
// argument lands past it instead of in it.
function StatusActions({ car, row }: { car: AdminListCar; row: RowState }) {
  return (
    <>
      {row.isDraft ? (
        row.hasPhoto ? (
          <form action={updateCarStatus.bind(null, car.id, 'available', undefined)}>
            <button type="submit" className={ACTION}>
              Publish
            </button>
          </form>
        ) : (
          <Link href={`/admin/inventory/${car.id}/edit`} className={ACTION}>
            Add a photo to publish
          </Link>
        )
      ) : (
        <>
          {car.status === 'available' && (
            <form action={updateCarStatus.bind(null, car.id, 'reserved', undefined)}>
              <button type="submit" className={ACTION}>
                Reserve
              </button>
            </form>
          )}
          <form action={updateCarStatus.bind(null, car.id, 'sold', undefined)}>
            <button type="submit" className={ACTION}>
              Mark sold
            </button>
          </form>
          <form action={updateCarStatus.bind(null, car.id, 'withdrawn', undefined)}>
            <button type="submit" className={ACTION}>
              Withdraw
            </button>
          </form>
        </>
      )}
      <Link
        href={`/admin/inventory/${car.id}/edit`}
        className={ACTION_PRIMARY}
      >
        Edit
      </Link>
    </>
  )
}
