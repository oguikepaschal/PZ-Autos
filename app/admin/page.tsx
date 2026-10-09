import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CarRowActions } from '@/components/admin/CarRowActions'
import { InventoryList, type InventoryRow } from '@/components/admin/InventoryList'
import { formatNGN, formatCarTitle, getFreshnessTier } from '@/lib/formatters'
import { getCarImagePublicUrl } from '@/lib/images'
import type { CarWithSupplier } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type AdminListCar = CarWithSupplier & {
  car_images: { storage_path: string; is_cover: boolean }[]
}

export default async function AdminInventoryPage() {
  const supabase = await createClient()

  const { data: cars, error } = await supabase
    .from('cars')
    .select(
      '*, supplier:suppliers(id, name, supplier_type), card_taps(count), car_images(storage_path, is_cover)'
    )
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
  const rows = typedCars.map((car) => {
    const cover = car.car_images.find((img) => img.is_cover) ?? car.car_images[0]
    return {
      car,
      title: formatCarTitle(car.make, car.model, car.year),
      featuredIndex: car.is_featured ? featuredIds.indexOf(car.id) : -1,
      hasPhoto: car.car_images.length > 0,
      thumbUrl: cover ? getCarImagePublicUrl(cover.storage_path) : null,
      cardTaps: car.card_taps[0]?.count ?? 0,
    }
  })
  const actionCar = (car: AdminListCar) => ({
    id: car.id,
    status: car.status,
    is_featured: car.is_featured,
    last_verified_at: car.last_verified_at,
  })
  const actionProps = (row: (typeof rows)[number]) => ({
    car: actionCar(row.car),
    hasPhoto: row.hasPhoto,
    featuredIndex: row.featuredIndex,
    featuredCount,
  })

  // Only what the phone cards show crosses to the client.
  const phoneRows: InventoryRow[] = rows.map((row) => ({
    car: actionCar(row.car),
    title: row.title,
    price: row.car.asking_price_ngn,
    cardTaps: row.cardTaps,
    thumbUrl: row.thumbUrl,
    hasPhoto: row.hasPhoto,
    featuredIndex: row.featuredIndex,
  }))

  const live = typedCars.filter((c) => c.status === 'available' || c.status === 'reserved').length
  const drafts = typedCars.filter((c) => c.status === 'draft').length
  const tiers = typedCars.map((c) => getFreshnessTier(c.last_verified_at))
  const stale = tiers.filter((t) => t === 'stale').length
  const overdue = tiers.filter((t) => t === 'critical').length
  const summary = [
    `${live} live`,
    drafts > 0 && `${drafts} ${drafts === 1 ? 'draft' : 'drafts'}`,
    stale > 0 && `${stale} ${stale === 1 ? 'needs' : 'need'} a re-check`,
    overdue > 0 && `${overdue} overdue`,
  ]
    .filter(Boolean)
    .join(' · ')

  const emptyMessage = (
    <>
      No cars yet.{' '}
      <Link href="/admin/inventory/new" className="underline">
        Add your first one
      </Link>
      .
    </>
  )

  const featuredWarning = featuredCount > 6 && (
    <p role="alert" className="flex items-start gap-2 font-body text-sm text-signal-red">
      <AlertCircle size={18} aria-hidden="true" className="mt-px shrink-0" />
      {featuredCount} cars are featured — only the first 6 by order will show on the landing page.
      Unfeature {featuredCount - 6} more.
    </p>
  )

  return (
    <div>
      {/* Phone: large title, search, filters and one card per car. */}
      <div className="md:hidden">
        <InventoryList
          rows={phoneRows}
          featuredCount={featuredCount}
          summary={summary}
          notice={featuredWarning || null}
          emptyMessage={emptyMessage}
        />
      </div>

      {/* Tablet and up: the table. */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-display text-ink">Inventory</h1>
            <p className="font-body text-sm text-text-muted">{summary}</p>
          </div>
          <Link
            href="/admin/inventory/new"
            className="inline-flex h-11 items-center rounded-full bg-ink text-ink-inverse font-body font-semibold text-sm px-5"
          >
            Add car
          </Link>
        </div>

        {featuredWarning && <div className="mb-4">{featuredWarning}</div>}

        <div className="rounded-xl bg-surface overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-fill">
              <tr>
                {['Car', 'Supplier', 'Status', 'Price', 'Card taps', 'Verified', 'Featured'].map((heading) => (
                  <th
                    key={heading}
                    className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted px-4 py-3"
                  >
                    {heading}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((row) => (
                <tr key={row.car.id}>
                  <td className="px-4 py-2 font-body text-sm text-ink font-semibold">{row.title}</td>
                  <td className="px-4 py-2 font-body text-sm text-text-muted">
                    {row.car.supplier?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2 font-body text-sm text-ink capitalize">{row.car.status}</td>
                  <td className="px-4 py-2 font-body text-sm text-ink tabular-nums">
                    {formatNGN(row.car.asking_price_ngn)}
                  </td>
                  <td className="px-4 py-2 font-body text-sm text-ink tabular-nums">{row.cardTaps}</td>
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
    </div>
  )
}
