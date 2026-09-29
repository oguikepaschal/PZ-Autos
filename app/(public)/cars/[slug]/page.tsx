import type { Metadata, Viewport } from 'next'
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

// Lets the mobile WhatsApp bar clear the iPhone home indicator; without
// viewport-fit=cover, env(safe-area-inset-bottom) is always 0 on iOS.
export const viewport: Viewport = { viewportFit: 'cover' }

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
  const description = `${formatMileage(car.mileage_km)} · ${formatNGN(car.asking_price_ngn)}`

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
      <div
        className={`mx-auto max-w-[1280px] px-4 md:px-10 pt-8 md:py-12 grid lg:grid-cols-[1fr_380px] gap-10 ${
          canEnquire ? 'pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12' : 'pb-8'
        }`}
      >
        <div>
          <CarGallery images={galleryImages} carName={title} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={car.status} size="lg" />
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-ink leading-tight">
            {title}
          </h1>
          <p className="font-body font-semibold text-2xl text-ink tabular-nums mt-2">
            {formatNGN(car.asking_price_ngn)}
          </p>
          <div className="mt-1">
            <FreshnessBadge lastVerifiedAt={car.last_verified_at} />
          </div>
          {canEnquire && (
            <WhatsAppButton
              message={generateCarEnquiryMessage(title, formatNGN(car.asking_price_ngn), pageUrl)}
            />
          )}

          {car.description && (
            <p className="font-body text-sm text-body-text mt-4 leading-relaxed">
              {car.description}
            </p>
          )}

          <div className="mt-6">
            <SpecList car={car} />
          </div>

          {car.key_features && car.key_features.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {car.key_features.map((feature) => (
                <li key={feature} className="font-body text-sm text-body-text">
                  · {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
