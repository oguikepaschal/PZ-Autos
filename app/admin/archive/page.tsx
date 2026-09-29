import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNGN, formatCarTitle, formatDate } from '@/lib/formatters'
import type { CarWithSupplier } from '@/lib/supabase/types'
import { updateCarStatus } from '../actions'

export const dynamic = 'force-dynamic'

// Both terminal statuses are archived, but shown with distinct treatment:
// sold = revenue (green-adjacent ink emphasis), withdrawn = dead listing
// (muted). Neither is ever red — status never is, per the brand rule.
export default async function ArchivePage() {
  const supabase = await createClient()

  const { data: cars, error } = await supabase
    .from('cars')
    .select('*, supplier:suppliers(id, name, supplier_type), whatsapp_clicks(count)')
    .in('status', ['sold', 'withdrawn'])
    .order('status_changed_at', { ascending: false })

  if (error) throw error
  const typedCars = (cars ?? []) as unknown as CarWithSupplier[]

  return (
    <div>
      <h1 className="mb-6 font-display font-black text-h3 tracking-display text-ink">Archive</h1>

      {typedCars.length === 0 ? (
        <p className="rounded-lg border border-hairline px-4 py-8 text-center font-body text-body text-text-muted">
          Nothing archived yet.
        </p>
      ) : (
        <>
          {/* Below md: one card per car. */}
          <ul className="space-y-3 md:hidden">
            {typedCars.map((car) => (
              <li key={car.id} className="rounded-lg border border-hairline p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-display font-bold text-body text-ink">
                    {formatCarTitle(car.make, car.model, car.year)}
                  </p>
                  <p className="shrink-0 font-body font-semibold text-body text-ink tabular-nums">
                    {formatNGN(car.asking_price_ngn)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-small">
                  <OutcomeBadge status={car.status} />
                  <span className="text-text-muted">{formatDate(car.status_changed_at)}</span>
                  <span className="text-text-muted">
                    WhatsApp taps{' '}
                    <span className="text-ink tabular-nums">{car.whatsapp_clicks[0]?.count ?? 0}</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
                  <ArchiveActions carId={car.id} />
                </div>
              </li>
            ))}
          </ul>

          {/* md up: the table. overflow-x-auto, not hidden, so the actions
              column can never be clipped out of reach. */}
          <div className="relative hidden overflow-x-auto rounded-lg border border-hairline md:block">
            <table className="w-full text-left">
              <thead className="bg-surface">
                <tr>
                  {['Car', 'Outcome', 'Price', 'WhatsApp taps', 'Date'].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-3 font-body text-caption font-semibold text-text-muted"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {typedCars.map((car) => (
                  <tr key={car.id}>
                    <td className="px-4 py-3 font-body text-small text-ink font-semibold">
                      {formatCarTitle(car.make, car.model, car.year)}
                    </td>
                    <td className="px-4 py-3">
                      <OutcomeBadge status={car.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-ink tabular-nums">
                      {formatNGN(car.asking_price_ngn)}
                    </td>
                    <td className="px-4 py-3 font-body text-small text-ink tabular-nums">
                      {car.whatsapp_clicks[0]?.count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-muted">
                      {formatDate(car.status_changed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <ArchiveActions carId={car.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function OutcomeBadge({ status }: { status: string }) {
  return (
    <span
      className={
        status === 'sold'
          ? 'inline-flex items-center whitespace-nowrap rounded-full bg-ink px-2.5 py-0.5 font-body text-caption font-semibold text-white'
          : 'inline-flex items-center whitespace-nowrap rounded-full border border-hairline px-2.5 py-0.5 font-body text-caption font-semibold text-text-muted'
      }
    >
      {status === 'sold' ? 'Sold, brokered' : 'Withdrawn'}
    </span>
  )
}

const ACTION_BASE =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-3 font-body text-small transition-colors'

// The explicit undefined fills archiveReason so the form's FormData
// argument lands past it instead of in it.
function ArchiveActions({ carId }: { carId: string }) {
  return (
    <>
      <form action={updateCarStatus.bind(null, carId, 'available', undefined)}>
        <button
          type="submit"
          className={`${ACTION_BASE} border border-hairline text-ink hover:border-text-muted`}
        >
          Restore
        </button>
      </form>
      <Link
        href={`/admin/inventory/${carId}/edit`}
        className={`${ACTION_BASE} bg-ink font-semibold text-white`}
      >
        View
      </Link>
    </>
  )
}
