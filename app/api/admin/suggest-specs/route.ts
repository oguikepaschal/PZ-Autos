import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { refuseUnlessAdmin } from '@/lib/adminApiGuard'
import { BODY_TYPES, CURRENT_YEAR, DRIVETRAINS, ENGINE_LAYOUTS, MIN_YEAR } from '@/lib/carOptions'

// The enums are built straight from lib/carOptions, so the API itself refuses
// to emit a value the form couldn't select. That's the primary guard against
// an out-of-list suggestion — CarForm re-checks with includes() as a second
// line, but nothing here relies on parsing prose or matching loosely.
const SuggestedSpecs = z.object({
  engine_layout: z.enum(ENGINE_LAYOUTS).nullable(),
  drivetrain: z.enum(DRIVETRAINS).nullable(),
  body_type: z.enum(BODY_TYPES).nullable(),
})

const SYSTEM_PROMPT = `You identify likely factory specifications for used cars listed by a Nigerian dealer.

Given a make, model and year, and optionally a variant (e.g. "350") and trim (e.g. "XSE"), return the single most likely value for each field for that exact car.

Rules:
- Use the variant and trim when given. Return null for a field whenever the answer genuinely varies across the variants, trims or engine options that were not specified, or when you do not recognise the make/model. A null is a correct, useful answer — the admin fills that field in themselves.
- Never guess to avoid returning null. A wrong value costs the dealer more than a blank one, because it looks authoritative.
- engine_layout describes the cylinder or motor layout of the most common configuration for that model year. Use "Electric" for battery-electric vehicles.`

// Suggestions are a convenience layered on top of manual entry, never a
// dependency of it: every failure path here returns {} so the form shows no
// chip and the admin carries on typing. A short timeout and no retries keep a
// slow or wedged upstream from holding the connection open.
const TIMEOUT_MS = 8000

export async function POST(request: NextRequest) {
  const refusal = await refuseUnlessAdmin('suggest-specs')
  if (refusal) return refusal

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { make, model, year, variant, trim } = body as {
    make?: unknown
    model?: unknown
    year?: unknown
    variant?: unknown
    trim?: unknown
  }

  if (typeof make !== 'string' || typeof model !== 'string' || !make.trim() || !model.trim()) {
    return NextResponse.json({ error: 'make and model are required' }, { status: 400 })
  }
  const parsedYear = Number(year)
  if (!Number.isInteger(parsedYear) || parsedYear < MIN_YEAR || parsedYear > CURRENT_YEAR + 1) {
    return NextResponse.json({ error: 'year is out of range' }, { status: 400 })
  }
  // Optional: absent or blank adds nothing to the prompt.
  if ((variant !== undefined && typeof variant !== 'string') || (trim !== undefined && typeof trim !== 'string')) {
    return NextResponse.json({ error: 'variant and trim must be strings' }, { status: 400 })
  }
  const details = [
    `Make: ${make.trim()}`,
    `Model: ${model.trim()}`,
    variant?.trim() && `Variant: ${variant.trim()}`,
    trim?.trim() && `Trim: ${trim.trim()}`,
    `Year: ${parsedYear}`,
  ].filter(Boolean)

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({})
  }

  try {
    const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 })

    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: 'low',
        format: zodOutputFormat(SuggestedSpecs),
      },
      messages: [
        {
          role: 'user',
          content: details.join('\n'),
        },
      ],
    })

    return NextResponse.json(response.parsed_output ?? {})
  } catch (error) {
    console.error('Spec suggestion failed:', error)
    return NextResponse.json({})
  }
}
