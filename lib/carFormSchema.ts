import { z } from 'zod'
import {
  BODY_TYPES,
  CONDITIONS,
  CURRENT_YEAR,
  DRIVETRAINS,
  ENGINE_LAYOUTS,
  FUEL_TYPES,
  CAR_MAKES_WITH_MODELS,
  MIN_YEAR,
  TRANSMISSIONS,
} from './carOptions'

const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, ' ')

// Case-insensitive match against a canonical list; anything not on it is
// kept as typed (already trimmed and collapsed).
const snapTo = (candidates: readonly string[], value: string) =>
  candidates.find((candidate) => candidate.toLowerCase() === value.toLowerCase()) ?? value

// Free entry stays allowed, but "toyota" and "Toyota" must never become two
// makes in the database, so a known make or model is saved in its canonical
// spelling.
function nameField(label: string) {
  return z
    .string()
    .transform(collapseSpaces)
    .pipe(z.string().min(1, `${label} is required`).max(60, `${label} is too long`))
}

// A car being edited may carry a value for one of these fields that predates
// the dropdown (typed freely before this form was constrained, or imported
// from a supplier's own listing). Rejecting it on save would either force
// the admin to guess which new option it "really" means, or crash the form
// — both worse than just keeping it selectable. So the enum each select is
// validated against is the canonical list, widened to also accept that
// car's own current value when it isn't already in the list. New selections
// are still confined to the canonical options; only the untouched legacy
// value is grandfathered in.
function constrainedField<T extends readonly [string, ...string[]]>(
  options: T,
  legacyValue?: string | null,
  requiredMessage?: string
) {
  const allowed: [string, ...string[]] =
    legacyValue && !(options as readonly string[]).includes(legacyValue) ? [...options, legacyValue] : [...options]

  const preprocessed = z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value.trim() : null),
    z.enum(allowed).nullable()
  )

  return requiredMessage
    ? preprocessed.refine((value) => value !== null, { message: requiredMessage })
    : preprocessed
}

// Optional free text: trimmed, and an empty field saves as null.
function optionalText(tooLongMessage: string) {
  return z
    .string()
    .trim()
    .max(60, tooLongMessage)
    .transform((value) => value || null)
}

export interface CarFormLegacyValues {
  fuel_type?: string | null
  transmission?: string | null
  drivetrain?: string | null
  engine_layout?: string | null
  body_type?: string | null
  condition?: string | null
}

export function buildCarFormSchema(legacy: CarFormLegacyValues = {}) {
  return z.object({
    make: nameField('Make').transform((make) => snapTo(Object.keys(CAR_MAKES_WITH_MODELS), make)),
    model: nameField('Model'),
    variant: optionalText('Variant is too long'),
    trim: optionalText('Trim is too long'),
    year: z.coerce
      .number()
      .int('Year must be a whole number')
      .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
      .max(CURRENT_YEAR + 1, `Year cannot be later than ${CURRENT_YEAR + 1}`),
    body_type: constrainedField(BODY_TYPES, legacy.body_type),
    transmission: constrainedField(TRANSMISSIONS, legacy.transmission),
    fuel_type: constrainedField(FUEL_TYPES, legacy.fuel_type),
    drivetrain: constrainedField(DRIVETRAINS, legacy.drivetrain),
    engine_layout: constrainedField(ENGINE_LAYOUTS, legacy.engine_layout),
    condition: constrainedField(CONDITIONS, legacy.condition, 'Condition is required'),
    // Free text in the database, so not an enum: the form's select confines
    // new choices to NIGERIAN_STATES, and a car's stored value is never rejected.
    state: z.string().trim().min(1, 'State is required'),
  })
    // The model snaps against the models of the (already canonical) make.
    .transform((values) => ({
      ...values,
      model: snapTo(CAR_MAKES_WITH_MODELS[values.make] ?? [], values.model),
    }))
}

export type CarFormValues = z.infer<ReturnType<typeof buildCarFormSchema>>

// Both forms currently report one validation message at a time (existing
// `error` state is a single string) — this collapses Zod's issue list into
// that shape rather than introducing per-field error UI as a drive-by
// change.
export function formatCarFormErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(' ')
}
