import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CarRowActions } from '@/components/admin/CarRowActions'
import { formatNGN, formatCarTitle } from '@/lib/formatters'
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

  // One derived list feeds both layouts, so the phone cards and the desktop
  // table can't disagree about a car.
  const rows = typedCars.map((car) => ({
    car,
    featuredIndex: car.is_featured ? featuredIds.indexOf(car.id) : -1,
    hasPhoto: (car.car_images[0]?.count ?? 0) > 0,
  }))
  const actionProps = (row: (typeof rows)[number]) => ({
    car: row.car,
    hasPhoto: row.hasPhoto,
    featuredIndex: row.featuredIndex,
    featuredCount,
  })
  const emptyMessage = (
    <>
      No cars yet.{' '}
      <Link href="/admin/inventory/new" className="underline">
        Add your first one
      </Link>
      .
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl text-ink">Inventory</h1>
        <Link
          href="/admin/inventory/new"
          className="inline-flex h-11 items-center rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-4"
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

      {/* Phone: one card per car. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.car.id} className="rounded-xl border border-hairline p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-ink">
                  {formatCarTitle(row.car.make, row.car.model, row.car.year)}
                </p>
                <p className="font-body text-sm text-text-muted">{row.car.supplier?.name ?? '—'}</p>
              </div>
              <p className="shrink-0 font-body text-sm font-semibold text-ink tabular-nums">
                {formatNGN(row.car.asking_price_ngn)}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 font-body text-sm text-text-muted">
              <span className="capitalize text-ink">{row.car.status}</span>
              <span className="tabular-nums">
                {row.car.whatsapp_clicks[0]?.count ?? 0} WhatsApp taps
              </span>
            </div>
            <div className="mt-2 divide-y divide-hairline border-t border-hairline">
              <div className="py-1">
                <CarRowActions {...actionProps(row)} section="verified" />
              </div>
              {row.car.status !== 'draft' && (
                <div className="py-1">
                  <CarRowActions {...actionProps(row)} section="featured" />
                </div>
              )}
              <div className="pt-1">
                <CarRowActions {...actionProps(row)} section="status" />
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-hairline px-4 py-8 text-center font-body text-text-muted">
            {emptyMessage}
          </li>
        )}
      </ul>

      {/* Tablet and up: the table. */}
      <div className="hidden md:block border border-hairline rounded-xl overflow-x-auto">
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
            {rows.map((row) => (
              <tr key={row.car.id}>
                <td className="px-4 py-2 font-body text-sm text-ink font-semibold">
                  {formatCarTitle(row.car.make, row.car.model, row.car.year)}
                </td>
                <td className="px-4 py-2 font-body text-sm text-text-muted">
                  {row.car.supplier?.name ?? '—'}
                </td>
                <td className="px-4 py-2 font-body text-sm text-ink capitalize">{row.car.status}</td>
                <td className="px-4 py-2 font-body text-sm text-ink tabular-nums">
                  {formatNGN(row.car.asking_price_ngn)}
                </td>
                <td className="px-4 py-2 font-body text-sm text-ink tabular-nums">
                  {row.car.whatsapp_clicks[0]?.count ?? 0}
                </td>
                <td className="px-4 py-2">
                  <CarRowActions {...actionProps(row)} section="verified" />
                </td>
                <td className="px-4 py-2">
                  <CarRowActions {...actionProps(row)} section="featured" />
                </td>
                <td className="px-4 py-2">
                  <CarRowActions {...actionProps(row)} section="status" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-body text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
