import { carImagePathFromSegments } from '@/lib/carImagePath'
import { createPublicClient } from '@/lib/supabase/publicClient'

// Showcase photos. car-images is private; the anon SELECT policy on
// storage.objects only matches photos of publicly visible cars, so a draft or
// withdrawn car's photo fails the download exactly like a path that does not
// exist. Every failure returns the same empty 404, so the route cannot be used
// to probe which photos exist. Photo paths never change content (UUID names,
// never overwritten), so only visibility can change: the TTL below is how
// long a car that went non-visible can still be served from caches.
const FOUND_CACHE = 'public, max-age=300, s-maxage=900'
const NOT_FOUND_CACHE = 'public, max-age=60, s-maxage=60'

function notFound() {
  return new Response(null, { status: 404, headers: { 'Cache-Control': NOT_FOUND_CACHE } })
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const path = carImagePathFromSegments(segments)
  if (!path) return notFound()

  try {
    const { data, error } = await createPublicClient().storage.from('car-images').download(path)
    if (error || !data) return notFound()

    return new Response(data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': FOUND_CACHE,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return notFound()
  }
}
