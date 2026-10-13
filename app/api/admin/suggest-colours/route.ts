import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { refuseUnlessAdmin } from '@/lib/adminApiGuard'
import { isCarImagePath } from '@/lib/carImagePath'
import { createClient } from '@/lib/supabase/server'

// Colour is a free-text column, so there is no list to validate against —
// whatever comes back is offered to the admin as typed.
const SuggestedColours = z.object({
  exterior_colour: z.string().nullable(),
  interior_colour: z.string().nullable(),
})

const MAX_PHOTOS = 3
const TIMEOUT_MS = 8000
// Long enough for the model call (TIMEOUT_MS) plus the fetch, short enough
// that a leaked URL is useless almost at once.
const SIGNED_URL_TTL_SECONDS = 60

// A colour name is one or two words. Anything longer is the model narrating
// rather than answering, and would be a poor value to write into the listing
// and a poor chip to render — drop it instead of offering it.
const MAX_COLOUR_LENGTH = 24

function usableColour(value: string | null): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed && trimmed.length <= MAX_COLOUR_LENGTH ? trimmed : null
}

// The vocabulary is a wording preference, not a constraint — the column is
// free text and a car that really is "Champagne" should read as Champagne.
// It exists so a hundred listings don't end up split across Pearl White,
// Alpine White and Off-white for the same paint.
const SYSTEM_PROMPT = `You read photographs of a used car and report its colours for a dealer's listing.

Return the exterior (body paint) colour and the interior (seats and cabin trim) colour.

Rules:
- Report a colour only from what you can actually see. If none of the photos show the car's exterior, return null for exterior_colour; if none show the cabin, return null for interior_colour. The two are independent.
- Return null when lighting, shadow or a reflection leaves you genuinely unsure. A blank field is better than a confident wrong colour in a public listing.
- Prefer plain showroom wording where it fits what you see: Black, White, Silver, Grey, Blue, Red, Green, Gold, Beige, Brown, Burgundy, Orange, Yellow. Use a more specific name only when the plain one would misdescribe the car.
- Answer with a short colour name or a 2-3 word phrase only — e.g. "Silver", "Metallic Silver", "Pearl White". Never a sentence, never a hedge, and never framing like "the car appears to be" or "looks like". Just the colour.`

export async function POST(request: NextRequest) {
  const refusal = await refuseUnlessAdmin('suggest-colours')
  if (refusal) return refusal

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { storagePaths } = body as { storagePaths?: unknown }
  if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
    return NextResponse.json({ error: 'storagePaths is required' }, { status: 400 })
  }

  const paths = storagePaths.slice(0, MAX_PHOTOS)
  if (!paths.every((path) => typeof path === 'string' && isCarImagePath(path))) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({})
  }

  try {
    const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 })

    // car-images is private, so each photo gets a 60-second signed URL minted
    // with the owner's session (never the service role). Anthropic fetches the
    // photos directly from Supabase — no bytes and no base64 pass through
    // this route.
    const supabase = await createClient()
    const signed = await Promise.all(
      paths.map((path) => supabase.storage.from('car-images').createSignedUrl(path as string, SIGNED_URL_TTL_SECONDS))
    )
    if (signed.some((result) => result.error || !result.data)) return NextResponse.json({})

    const imageBlocks = signed.map((result) => ({
      type: 'image' as const,
      source: { type: 'url' as const, url: result.data!.signedUrl },
    }))

    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: 'low',
        format: zodOutputFormat(SuggestedColours),
      },
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: 'What are this car’s exterior and interior colours?' },
          ],
        },
      ],
    })

    const parsed = response.parsed_output
    if (!parsed) return NextResponse.json({})

    return NextResponse.json({
      exterior_colour: usableColour(parsed.exterior_colour),
      interior_colour: usableColour(parsed.interior_colour),
    })
  } catch (error) {
    console.error('Colour suggestion failed:', error)
    return NextResponse.json({})
  }
}
