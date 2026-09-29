import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { CarGallery } from '@/components/showcase/CarGallery'
import { StatusBadge } from '@/components/showcase/StatusBadge'
import { FreshnessBadge } from '@/components/showcase/FreshnessBadge'
import { SpecList } from '@/components/showcase/SpecList'
import { WhatsAppButton } from '@/components/showcase/WhatsAppButton'
import { getPublicCarBySlug } from '@/lib/showcase/queries'
import { getCarImagePublicUrl } from '@/lib/images'
import { formatNGN, formatCarTitle, formatMileage } from '@/lib/formatters'
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

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const pageUrl = `${protocol}://${host}/cars/${car.slug}`

  const galleryImages = car.images.map((img) => ({
    url: getCarImagePublicUrl(img.storage_path),
    sort_order: img.sort_order,
    is_cover: img.is_cover,
  }))

  return (
    <>
      <PublicHeader showBackButton />
      {/* The mobile WhatsApp bar is fixed to the bottom, so the page reserves
          its height plus the home-indicator inset (viewport-fit=cover is set
          in the root layout, which is what makes env() non-zero on iOS). */}
      <div
        className={`container-page pt-6 md:pt-12 grid gap-8 lg:grid-cols-5 lg:gap-12 ${
          canEnquire ? 'pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-section' : 'pb-12 md:pb-section'
        }`}
      >
        <div className="min-w-0 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <CarGallery images={galleryImages} carName={title} />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <StatusBadge status={car.status} size="lg" />
          <h1 className="mt-3 font-display font-black text-h2 tracking-display text-ink">
            {title}
          </h1>
          <p className="mt-3 font-body font-semibold text-h2 text-ink tabular-nums">
            {formatNGN(car.asking_price_ngn)}
          </p>
          <div className="mt-2">
            <FreshnessBadge lastVerifiedAt={car.last_verified_at} />
          </div>
          {canEnquire && (
            <WhatsAppButton
              carId={car.id}
              message={generateCarEnquiryMessage(title, formatNGN(car.asking_price_ngn), pageUrl)}
            />
          )}

          {car.description && (
            <p className="mt-6 max-w-measure font-body text-body text-body-text">
              {car.description}
            </p>
          )}

          <div className="mt-8">
            <SpecList car={car} />
          </div>

          {car.key_features && car.key_features.length > 0 && (
            <>
              <h2 className="mt-8 font-display font-bold text-h3 tracking-display text-ink">
                Features
              </h2>
              <ul className="mt-3 grid list-disc gap-x-6 gap-y-2 pl-5 marker:text-text-muted sm:grid-cols-2">
                {car.key_features.map((feature) => (
                  <li key={feature} className="font-body text-body text-body-text">
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
