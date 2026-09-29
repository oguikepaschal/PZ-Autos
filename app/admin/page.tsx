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

export default async function AdminInventoryPage() {
  const supabase = await createClient()

  const { data: cars, error } = await supabase
    .from('cars')
    .select('*, supplier:suppliers(id, name, supplier_type), whatsapp_clicks(count)')
    .in('status', ['draft', 'available', 'reserved'])
    .order('is_featured', { ascending: false })
    .order('featured_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  const typedCars = (cars ?? []) as unknown as CarWithSupplier[]
  const featuredIds = typedCars.filter((c) => c.is_featured).map((c) => c.id)
  const featuredCount = featuredIds.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl text-ink">Inventory</h1>
        <Link
          href="/admin/inventory/new"
          className="rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-4 py-2"
        >
          Add car
        </Link>
      </div>

      {featuredCount > 6 && (
        <p className="font-body text-sm text-signal-red mb-4">
          {featuredCount} cars are featured — only the first 6 by order will show on the landing
          page. Unfeature {featuredCount - 6} more.
        </p>
      )}

      <div className="border border-hairline rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-placeholder-b">
            <tr>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Car
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Supplier
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Status
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Price
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                WhatsApp taps
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Verified
              </th>
              <th className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3">
                Featured
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {typedCars.map((car) => {
              const featuredIndex = car.is_featured ? featuredIds.indexOf(car.id) : -1
              const canFeature = ['available', 'reserved'].includes(car.status)

              return (
              <tr key={car.id}>
                <td className="px-4 py-3 font-body text-sm text-ink font-semibold">
                  {formatCarTitle(car.make, car.model, car.year)}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-muted">
                  {car.supplier?.name ?? '—'}
                </td>
                <td className="px-4 py-3 font-body text-sm text-ink capitalize">{car.status}</td>
                <td className="px-4 py-3 font-body text-sm text-ink tabular-nums">
                  {formatNGN(car.asking_price_ngn)}
                </td>
                <td className="px-4 py-3 font-body text-sm text-ink tabular-nums">
                  {car.whatsapp_clicks[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StaleIndicator lastVerifiedAt={car.last_verified_at} />
                    <form action={markVerified.bind(null, car.id)}>
                      <button
                        type="submit"
                        className="font-body text-xs text-text-muted hover:text-ink underline"
                      >
                        Mark verified
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <form action={setCarFeatured.bind(null, car.id, !car.is_featured)}>
                      <button
                        type="submit"
                        role="switch"
                        aria-checked={car.is_featured}
                        disabled={!car.is_featured && !canFeature}
                        aria-label={car.is_featured ? 'Remove from featured' : 'Add to featured'}
                        title={
                          car.is_featured
                            ? 'Featured — click to remove'
                            : canFeature
                              ? 'Click to feature on the landing page'
                              : 'Only available/reserved cars can be featured'
                        }
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                          'disabled:opacity-30 disabled:cursor-not-allowed',
                          car.is_featured ? 'bg-signal-red' : 'bg-hairline'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                            car.is_featured ? 'translate-x-[18px]' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </form>
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
                            className="rounded p-0.5 text-text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp size={14} />
                          </button>
                        </form>
                        <form action={moveFeaturedDown.bind(null, car.id)}>
                          <button
                            type="submit"
                            aria-label="Move down"
                            disabled={featuredIndex === featuredIds.length - 1}
                            className="rounded p-0.5 text-text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    {/* The explicit undefined fills archiveReason so the form's
                        FormData argument lands past it instead of in it. */}
                    <form action={updateCarStatus.bind(null, car.id, 'sold', undefined)}>
                      <button
                        type="submit"
                        className="font-body text-xs text-text-muted hover:text-ink underline"
                      >
                        Mark sold
                      </button>
                    </form>
                    <form action={updateCarStatus.bind(null, car.id, 'withdrawn', undefined)}>
                      <button
                        type="submit"
                        className="font-body text-xs text-text-muted hover:text-ink underline"
                      >
                        Withdraw
                      </button>
                    </form>
                    <Link
                      href={`/admin/inventory/${car.id}/edit`}
                      className="font-body text-sm font-semibold text-ink hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
              )
            })}
            {typedCars.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-body text-text-muted">
                  No cars yet.{' '}
                  <Link href="/admin/inventory/new" className="underline">
                    Add your first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
