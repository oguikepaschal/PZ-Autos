import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isRateLimited } from '@/lib/showcase/rateLimiter'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Records one tap on the WhatsApp button. The button never waits on this and
// ignores the response, so every failure just returns quietly.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(`whatsapp-click:${ip}`)) {
      return new NextResponse(null, { status: 429 })
    }

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

    const { error } = await supabase.from('whatsapp_clicks').insert({ car_id: carId })
    if (error) {
      console.error('WhatsApp click insert failed:', error)
      return new NextResponse(null, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('WhatsApp click failed:', err)
    return new NextResponse(null, { status: 500 })
  }
}
