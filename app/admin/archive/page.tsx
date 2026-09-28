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
    .select('*, supplier:suppliers(id, name, supplier_type)')
    .in('status', ['sold', 'withdrawn'])
    .order('status_changed_at', { ascending: false })

  if (error) throw error
  const typedCars = (cars ?? []) as unknown as CarWithSupplier[]

  return (
    <div>
      <h1 className="font-display font-black text-2xl text-ink mb-6">Archive</h1>

      <div className="border border-hairline rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-placeholder-b">
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
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {typedCars.map((car) => (
              <tr key={car.id}>
                <td className="px-4 py-3 font-body text-sm text-ink font-semibold">
                  {formatCarTitle(car.make, car.model, car.year)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      car.status === 'sold'
                        ? 'inline-flex items-center rounded-full bg-ink text-white px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide'
                        : 'inline-flex items-center rounded-full border border-hairline text-text-muted px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide'
                    }
                  >
                    {car.status === 'sold' ? 'Sold — brokered' : 'Withdrawn'}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-sm text-ink tabular-nums">
                  {formatNGN(car.asking_price_ngn)}
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
                        className="font-body text-xs text-text-muted hover:text-ink underline"
                      >
                        Restore
                      </button>
                    </form>
                    <Link
                      href={`/admin/inventory/${car.id}/edit`}
                      className="font-body text-sm font-semibold text-ink hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {typedCars.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-body text-text-muted">
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
