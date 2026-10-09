import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNGN, formatCarTitle, formatDate } from '@/lib/formatters'
import type { CarWithSupplier } from '@/lib/supabase/types'
import { updateCarStatus } from '../actions'

export const dynamic = 'force-dynamic'

// Both terminal statuses are archived, but shown with distinct treatment:
// sold = revenue (the always-dark pill), withdrawn = dead listing (muted). Neither is ever red — status never is, per the brand rule.
export default async function ArchivePage() {
  const supabase = await createClient()

  const { data: cars, error } = await supabase
    .from('cars')
    .select('*, supplier:suppliers(id, name, supplier_type), card_taps(count)')
    .in('status', ['sold', 'withdrawn'])
    .order('status_changed_at', { ascending: false })

  if (error) throw error
  const typedCars = (cars ?? []) as unknown as CarWithSupplier[]

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:p-0">
      <h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-display text-ink mb-6 md:text-2xl">
        Archive
      </h1>

      <div className="rounded-xl bg-surface overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-fill">
            <tr>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Car
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Outcome
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Price
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Card taps
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {typedCars.map((car) => (
              <tr key={car.id}>
                <td className="px-4 py-3 font-body text-sm text-ink font-semibold">
                  {formatCarTitle(car)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      car.status === 'sold'
                        ? 'inline-flex items-center rounded-full bg-surface-dark text-white px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide'
                        : 'inline-flex items-center rounded-full border border-hairline text-text-muted px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide'
                    }
                  >
                    {car.status === 'sold' ? 'Sold — brokered' : 'Withdrawn'}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-sm text-ink tabular-nums">
                  {formatNGN(car.asking_price_ngn)}
                </td>
                <td className="px-4 py-3 font-body text-sm text-ink tabular-nums">
                  {car.card_taps[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {formatDate(car.status_changed_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    {/* The explicit undefined fills archiveReason so the form's
                        FormData argument lands past it instead of in it. */}
                    <form action={updateCarStatus.bind(null, car.id, 'available', undefined)}>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center px-1 font-body text-xs text-text-muted hover:text-ink underline"
                      >
                        Restore
                      </button>
                    </form>
                    <Link
                      href={`/admin/inventory/${car.id}/edit`}
                      className="inline-flex min-h-11 items-center px-2 font-body text-sm font-semibold text-ink hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {typedCars.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-text-muted">
                  Nothing archived yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
