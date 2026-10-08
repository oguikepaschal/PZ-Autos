import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { CarGallery } from '@/components/showcase/CarGallery'
import { StatusBadge } from '@/components/showcase/StatusBadge'
import { FreshnessBadge } from '@/components/showcase/FreshnessBadge'
import { SpecList } from '@/components/showcase/SpecList'
import { ShareButton } from '@/components/showcase/ShareButton'
import { WhatsAppButton } from '@/components/showcase/WhatsAppButton'
import { getPublicCarBySlug } from '@/lib/showcase/queries'
import { getCarImagePublicUrl } from '@/lib/images'
import { getSiteOrigin } from '@/lib/siteOrigin'
import { formatNGN, formatCarTitle, formatMileage, toDisplayCase } from '@/lib/formatters'
import { generateCarEnquiryMessage } from '@/lib/whatsapp'

export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const car = await getPublicCarBySlug(slug)
  if (!car) return { title: 'Car not found' }

  const title = formatCarTitle(car.make, car.model, car.year)
  // The cover image, never images[0] — sort_order and is_cover are
  // independent, so the first-by-order photo is not reliably the cover.
  const cover = car.images.find((img) => img.is_cover) ?? car.images[0]
  const description = `${formatMileage(car.mileage_km)}, ${formatNGN(car.asking_price_ngn)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cover ? [{ url: getCarImagePublicUrl(cover.storage_path) }] : [],
    },
  }
}

export default async function CarDetailPage({ params }: PageProps) {
  const { slug } = await params
  const car = await getPublicCarBySlug(slug)
  if (!car) notFound()

  const title = formatCarTitle(car.make, car.model, car.year)
  const canEnquire = car.status !== 'sold'
  const pageUrl = `${await getSiteOrigin()}/cars/${car.slug}`

  const galleryImages = car.images.map((img) => ({
    url: getCarImagePublicUrl(img.storage_path),
    sort_order: img.sort_order,
    is_cover: img.is_cover,
  }))

  const specTiles = [
    { label: 'Year', value: String(car.year) },
    { label: 'Mileage', value: formatMileage(car.mileage_km) },
    { label: 'Transmission', value: toDisplayCase(car.transmission) || 'Not listed' },
    { label: 'Fuel type', value: toDisplayCase(car.fuel_type) || 'Not listed' },
  ]

  return (
    <>
      {/* Phones open straight onto the photo with glass back and share
          buttons; from md up the page keeps the header. */}
      <div className="hidden md:contents">
        <PublicHeader showBackButton />
      </div>
      {/* Below md the floating WhatsApp pill needs its height, its lift and
          the home-indicator inset kept clear. */}
      <div
        className={`grid gap-6 md:container-page md:pt-12 lg:grid-cols-5 lg:gap-12 ${
          canEnquire ? 'pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-section' : 'pb-12 md:pb-section'
        }`}
      >
        <div className="relative min-w-0 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <CarGallery images={galleryImages} carName={title} />
          <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+8px)] z-40 flex justify-between md:absolute md:top-4">
            <Link
              href="/cars"
              aria-label="Back to all cars"
              className="glass flex size-11 items-center justify-center rounded-full text-ink"
            >
              <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
            </Link>
            <ShareButton title={title} url={pageUrl} />
          </div>
        </div>

        <div className="min-w-0 px-5 md:px-0 lg:col-span-2">
          {car.status !== 'available' && <StatusBadge status={car.status} size="lg" className="mb-3" />}
          <h1 className="font-display text-[28px] font-extrabold leading-[1.08] tracking-display text-ink md:text-h2">
            {title}
          </h1>
          <p className="mt-1 font-display text-[22px] font-bold tracking-[-0.01em] text-ink tabular-nums md:text-h3">
            {formatNGN(car.asking_price_ngn)}
          </p>
          {car.condition && (
            <p className="mt-1 font-body text-[15px] text-text-muted">{toDisplayCase(car.condition)}</p>
          )}
          <div className="mt-1">
            <FreshnessBadge lastVerifiedAt={car.last_verified_at} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2.5">
            {specTiles.map((tile) => (
              <div key={tile.label} className="flex flex-col gap-0.5 rounded-2xl bg-surface p-3.5">
                <dt className="font-body text-[13px] text-text-muted">{tile.label}</dt>
                <dd className="font-body text-[17px] font-semibold text-ink">{tile.value}</dd>
              </div>
            ))}
          </dl>

          {canEnquire && (
            <WhatsAppButton
              carId={car.id}
              label="WhatsApp about this car"
              message={generateCarEnquiryMessage(title, formatNGN(car.asking_price_ngn), pageUrl)}
            />
          )}

          {car.description && (
            <p className="mt-6 max-w-measure font-body text-body text-ink">{car.description}</p>
          )}

          <div className="mt-8">
            <SpecList car={car} />
          </div>

          {car.key_features && car.key_features.length > 0 && (
            <>
              <h2 className="mt-8 font-display font-bold text-h3 tracking-display text-ink">Features</h2>
              <ul className="mt-3 grid list-disc gap-x-6 gap-y-2 pl-5 marker:text-text-muted sm:grid-cols-2">
                {car.key_features.map((feature) => (
                  <li key={feature} className="font-body text-body text-ink">
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
