import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isOwnerRequest } from '@/lib/adminApiGuard'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Records one tap on a car card's photo or name. The card never waits on this
// and ignores the response, so every failure just returns a bare status.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const carId = body && typeof body === 'object' ? (body as { car_id?: unknown }).car_id : null
    if (typeof carId !== 'string' || !UUID_PATTERN.test(carId)) {
      return new NextResponse(null, { status: 400 })
    }

    const supabase = createServiceClient()

    // Only cars the public can see count — the same visibility rule as the
    // car page itself, via the view that owns that rule.
    const { data: car } = await supabase
      .from('public_cars_view')
      .select('id')
      .eq('id', carId)
      .maybeSingle()
    if (!car) return new NextResponse(null, { status: 400 })

    // The owner browsing the site isn't a customer: skip the count.
    if (await isOwnerRequest()) return new NextResponse(null, { status: 204 })

    const { error } = await supabase.from('card_taps').insert({ car_id: carId })
    if (error) {
      console.error('Card tap insert failed:', error)
      return new NextResponse(null, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Card tap failed:', err)
    return new NextResponse(null, { status: 500 })
  }
}
