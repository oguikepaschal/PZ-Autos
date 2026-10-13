import { carImagePathFromRequest } from '@/lib/carImagePath'
import { createClient } from '@/lib/supabase/server'

// Admin photo previews: any photo, including drafts, withdrawn cars and photos
// uploaded but not yet saved. Runs on the owner's session, so Storage RLS
// (car_images_owner_read) is the authority — a non-owner session fails the
// download. A request with no session would fall through to the anon role and
// see visible cars' photos, so it is refused here before any download.
// Never cached: the response is only for the signed-in owner.
function notFound() {
  return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const path = carImagePathFromRequest(request.url, segments)
  if (!path) return notFound()

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return notFound()

    const { data, error } = await supabase.storage.from('car-images').download(path)
    if (error || !data) return notFound()

    return new Response(data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return notFound()
  }
}
