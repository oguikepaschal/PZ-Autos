'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CUSTOM_SUPPLIER, SupplierPicker, createOneOffSupplier } from './SupplierPicker'
import { ImageUploader, type PendingImage } from './ImageUploader'
import { useDiscardUnsavedPhotos } from './useDiscardUnsavedPhotos'
import { MakeModelFields } from './MakeModelFields'
import { ConstrainedSelect } from './ConstrainedSelect'
import { SuggestionChip } from './SuggestionChip'
import {
  BottomBar,
  FormError,
  Row,
  RowGroup,
  SelectRow,
  StackedRow,
  bottomBarSpace,
  primaryButtonClass,
  rowControlClass,
  rowSelectClass,
  secondaryButtonClass,
  stackedControlClass,
} from './FormRows'
import { createCarWithImages } from '@/lib/supabase/storage'
import { generateCarSlug } from '@/lib/slugify'
import { buildCarFormSchema, formatCarFormErrors } from '@/lib/carFormSchema'
import {
  BODY_TYPES,
  CONDITIONS,
  DEFAULT_CONDITION,
  DEFAULT_ENGINE_LAYOUT,
  DEFAULT_FUEL_TYPE,
  DEFAULT_TRANSMISSION,
  DRIVETRAINS,
  ENGINE_LAYOUTS,
  FUEL_TYPES,
  NIGERIAN_STATES,
  TRANSMISSIONS,
  getYearOptions,
} from '@/lib/carOptions'
import type { Supplier } from '@/lib/supabase/types'

interface CarFormProps {
  suppliers: Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]
}

const YEAR_OPTIONS = getYearOptions()

// A new car has no saved photos.
const NO_SAVED_PATHS: ReadonlySet<string> = new Set()

// Long enough that typing "Corolla" one letter at a time fires one request
// rather than seven, short enough that the chip lands while the admin is still
// looking at the field.
const SUGGEST_DEBOUNCE_MS = 500

// Enough of the car to cover both the body and the cabin without paying for
// every photo in a twenty-shot upload.
const COLOUR_SUGGESTION_PHOTOS = 3

interface ColourSuggestions {
  exterior_colour?: string | null
  interior_colour?: string | null
}

interface SpecSuggestions {
  body_type?: string | null
  drivetrain?: string | null
  engine_layout?: string | null
}

// The route's response schema already confines it to these lists, so this is a
// second line rather than the first: it exists so a schema drift, a stale
// deployment, or a hand-crafted response can never put a value on screen that
// the select couldn't hold. Same rule the form applies everywhere else — an
// enum field takes a value only if it is exactly one of its options.
function suggestionInOptions(options: readonly string[], value: unknown): string | null {
  return typeof value === 'string' && options.includes(value) ? value : null
}

export function CarForm({ suppliers: initialSuppliers }: CarFormProps) {
  const router = useRouter()
  const [folderId] = useState(() => crypto.randomUUID())
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [supplierId, setSupplierId] = useState('')
  const [customSupplierName, setCustomSupplierName] = useState('')
  const [images, setImages] = useState<PendingImage[]>([])
  const markSaved = useDiscardUnsavedPhotos(images.map((img) => img.storagePath))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')
  const [trim, setTrim] = useState('')
  const [year, setYear] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [transmission, setTransmission] = useState<string>(DEFAULT_TRANSMISSION)
  const [fuelType, setFuelType] = useState<string>(DEFAULT_FUEL_TYPE)
  const [drivetrain, setDrivetrain] = useState('')
  const [engineLayout, setEngineLayout] = useState<string>(DEFAULT_ENGINE_LAYOUT)
  const [condition, setCondition] = useState<string>(DEFAULT_CONDITION)
  const [state, setState] = useState('')
  // Controlled like every other suggestible field. These two were read out of
  // FormData at submit time, which is fine for typing but leaves nothing for a
  // suggestion to write into. Empty string still submits as null, exactly as
  // the FormData read did.
  const [exteriorColour, setExteriorColour] = useState('')
  const [interiorColour, setInteriorColour] = useState('')
  // Which bottom-bar button is saving, for its label.
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'available' | null>(null)

  const [specSuggestions, setSpecSuggestions] = useState<SpecSuggestions>({})
  const [colourSuggestions, setColourSuggestions] = useState<ColourSuggestions>({})

  // Keyed on the paths themselves rather than the `images` array so that
  // setting a cover photo or reordering — which rebuilds the array without
  // changing which cars are pictured — doesn't fire another vision call.
  const colourPhotoKey = images
    .slice(0, COLOUR_SUGGESTION_PHOTOS)
    .map((image) => image.storagePath)
    .join(',')

  // Asks for likely specs once Make, Model and Year are all present. Nothing
  // here writes to a field — it only populates the chips, so an in-flight or
  // failed request is invisible to an admin filling the form by hand. The
  // abort is what guarantees that: a response for "Camry" can never land after
  // the admin has moved on to "Corolla".
  useEffect(() => {
    const trimmedMake = make.trim()
    const trimmedModel = model.trim()
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      // Emptying one of the three trigger fields retracts the chips rather
      // than leaving stale ones pointing at a car that is no longer described.
      if (!trimmedMake || !trimmedModel || !year) {
        setSpecSuggestions({})
        return
      }

      try {
        const res = await fetch('/api/admin/suggest-specs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ make: trimmedMake, model: trimmedModel, variant, trim, year: Number(year) }),
          signal: controller.signal,
        })
        // A refused or failed request (429 included) clears the chips, so
        // suggestions for the previous variant or trim never linger.
        if (!res.ok) {
          setSpecSuggestions({})
          return
        }

        const data = (await res.json()) as SpecSuggestions
        setSpecSuggestions({
          body_type: suggestionInOptions(BODY_TYPES, data.body_type),
          drivetrain: suggestionInOptions(DRIVETRAINS, data.drivetrain),
          engine_layout: suggestionInOptions(ENGINE_LAYOUTS, data.engine_layout),
        })
      } catch {
        // Aborted, offline, or a malformed body — leave whatever chips are
        // already on screen and never surface this to the admin.
      }
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [make, model, variant, trim, year])

  // Runs once an upload has settled — ImageUploader only calls onChange after
  // every file in the batch has finished uploading, so by the time this key
  // changes the photos are readable at their public URLs. Same shape as the
  // spec effect above, and the same guarantee: chips only, never a write.
  useEffect(() => {
    const storagePaths = colourPhotoKey ? colourPhotoKey.split(',') : []
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      if (storagePaths.length === 0) {
        setColourSuggestions({})
        return
      }

      try {
        const res = await fetch('/api/admin/suggest-colours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePaths }),
          signal: controller.signal,
        })
        if (!res.ok) return

        const data = (await res.json()) as ColourSuggestions
        setColourSuggestions({
          exterior_colour: typeof data.exterior_colour === 'string' ? data.exterior_colour : null,
          interior_colour: typeof data.interior_colour === 'string' ? data.interior_colour : null,
        })
      } catch {
        // Same as above — a failed or aborted call simply means no chip.
      }
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [colourPhotoKey])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Save draft keeps the car private; Post car publishes it. Reserving and
    // featuring happen from the edit screen once the car exists. Implicit
    // submission (Enter in a field) uses the first button, Save draft, so it
    // can never publish by accident.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const status: 'draft' | 'available' = submitter?.value === 'available' ? 'available' : 'draft'

    const form = new FormData(e.currentTarget)
    const askingPrice = Number(form.get('asking_price_ngn'))
    const costPriceRaw = form.get('cost_price_ngn')
    const keyFeaturesRaw = String(form.get('key_features') ?? '')

    if (!supplierId) {
      setError('Select or create a supplier')
      return
    }
    if (supplierId === CUSTOM_SUPPLIER && !customSupplierName.trim()) {
      setError('Enter a supplier name')
      return
    }

    const parsed = buildCarFormSchema().safeParse({
      make,
      model,
      variant,
      trim,
      year,
      body_type: bodyType,
      transmission,
      fuel_type: fuelType,
      drivetrain,
      engine_layout: engineLayout,
      condition,
      state,
    })
    if (!parsed.success) {
      setError(formatCarFormErrors(parsed.error))
      return
    }
    if (!askingPrice) {
      setError('Asking price is required')
      return
    }
    // A draft can be saved before the photos are taken; anything public needs one.
    if (status !== 'draft' && images.length === 0) {
      setError('Add at least one photo to publish')
      return
    }

    setSubmitting(true)
    setSubmitIntent(status)

    try {
      const slug = generateCarSlug(parsed.data)

      const resolvedSupplierId =
        supplierId === CUSTOM_SUPPLIER ? await createOneOffSupplier(customSupplierName) : supplierId

      await createCarWithImages(
        folderId,
        {
          slug,
          supplier_id: resolvedSupplierId,
          make: parsed.data.make,
          model: parsed.data.model,
          variant: parsed.data.variant,
          trim: parsed.data.trim,
          year: parsed.data.year,
          body_type: parsed.data.body_type,
          transmission: parsed.data.transmission,
          fuel_type: parsed.data.fuel_type,
          mileage_km: form.get('mileage_km') ? Number(form.get('mileage_km')) : null,
          exterior_colour: exteriorColour.trim() || null,
          interior_colour: interiorColour.trim() || null,
          engine_layout: parsed.data.engine_layout,
          drivetrain: parsed.data.drivetrain,
          condition: parsed.data.condition,
          description: (form.get('description') as string) || null,
          key_features: keyFeaturesRaw
            ? keyFeaturesRaw.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined,
          location_area: (form.get('location_area') as string) || null,
          state: parsed.data.state,
          vin: (form.get('vin') as string) || null,
          registration_plate: (form.get('registration_plate') as string) || null,
          cost_price_ngn: costPriceRaw ? Number(costPriceRaw) : null,
          asking_price_ngn: askingPrice,
          status,
          acquisition_notes: (form.get('acquisition_notes') as string) || null,
        },
        images.map((img, index) => ({
          storage_path: img.storagePath,
          is_cover: img.isCover,
          sort_order: index,
        }))
      )

      markSaved()
      router.push('/admin')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Could not save this car. Nothing was created — check the fields and try again.')
    } finally {
      setSubmitting(false)
      setSubmitIntent(null)
    }
  }

  const suggestions = [
    { label: 'Body', value: specSuggestions.body_type ?? null, current: bodyType, onAccept: setBodyType },
    { label: 'Drivetrain', value: specSuggestions.drivetrain ?? null, current: drivetrain, onAccept: setDrivetrain },
    { label: 'Engine', value: specSuggestions.engine_layout ?? null, current: engineLayout, onAccept: setEngineLayout },
    {
      label: 'Exterior',
      value: colourSuggestions.exterior_colour ?? null,
      current: exteriorColour,
      onAccept: setExteriorColour,
    },
    {
      label: 'Interior',
      value: colourSuggestions.interior_colour ?? null,
      current: interiorColour,
      onAccept: setInteriorColour,
    },
  ].filter((s) => s.value)

  return (
    <form onSubmit={handleSubmit} data-lock-overscroll className="md:max-w-2xl">
      {/* Phone: a glass top bar. From md up the admin header is the top. */}
      <header className="glass fixed inset-x-0 top-0 z-40 rounded-none border-x-0 border-t-0 pt-[env(safe-area-inset-top)] md:hidden">
        <div className="flex h-[52px] items-center justify-between px-4">
          <Link href="/admin" className="flex h-11 min-w-16 items-center font-body text-[17px] font-medium text-ink">
            Cancel
          </Link>
          <h1 className="font-body text-[17px] font-bold text-ink">New car</h1>
          <span className="min-w-16" aria-hidden="true" />
        </div>
      </header>

      <div
        className={`flex flex-col gap-[22px] px-4 pt-[calc(env(safe-area-inset-top)+68px)] md:px-0 md:pt-0 ${bottomBarSpace}`}
      >
        <h1 className="hidden font-display text-2xl font-extrabold tracking-display text-ink md:block">Add a car</h1>

        <ImageUploader folderId={folderId} images={images} savedPaths={NO_SAVED_PATHS} onChange={setImages} />

        {suggestions.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Suggestions
            </h2>
            <div className="-my-0.5 flex flex-wrap gap-x-2">
              {suggestions.map((s) => (
                <SuggestionChip key={s.label} label={s.label} value={s.value} current={s.current} onAccept={s.onAccept} />
              ))}
            </div>
          </section>
        )}

        <RowGroup title="Car">
          <MakeModelFields
            make={make}
            model={model}
            variant={variant}
            trim={trim}
            onMakeChange={setMake}
            onModelChange={setModel}
            onVariantChange={setVariant}
            onTrimChange={setTrim}
          />
          <SelectRow label="Year">
            <select name="year" value={year} onChange={(e) => setYear(e.target.value)} required className={rowSelectClass}>
              <option value="">Select</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </SelectRow>
        </RowGroup>

        <RowGroup title="Price">
          <Row label="Asking price">
            <input
              name="asking_price_ngn"
              type="number"
              inputMode="numeric"
              min={1}
              required
              placeholder="₦ amount"
              className={rowControlClass}
            />
          </Row>
        </RowGroup>

        <RowGroup title="Specs">
          <SelectRow label="Body type">
            <ConstrainedSelect name="body_type" options={BODY_TYPES} value={bodyType} onChange={setBodyType} placeholder="Select" />
          </SelectRow>
          <SelectRow label="Condition">
            <ConstrainedSelect name="condition" options={CONDITIONS} value={condition} onChange={setCondition} placeholder="Select" />
          </SelectRow>
          <SelectRow label="Transmission">
            <ConstrainedSelect
              name="transmission"
              options={TRANSMISSIONS}
              value={transmission}
              onChange={setTransmission}
              placeholder="Select"
            />
          </SelectRow>
          <SelectRow label="Fuel type">
            <ConstrainedSelect name="fuel_type" options={FUEL_TYPES} value={fuelType} onChange={setFuelType} placeholder="Select" />
          </SelectRow>
          <Row label="Mileage">
            <input name="mileage_km" type="number" inputMode="numeric" min={0} placeholder="km" className={rowControlClass} />
          </Row>
          <Row label="Exterior">
            <input
              name="exterior_colour"
              placeholder="Colour"
              value={exteriorColour}
              onChange={(e) => setExteriorColour(e.target.value)}
              className={rowControlClass}
            />
          </Row>
          <Row label="Interior">
            <input
              name="interior_colour"
              placeholder="Colour"
              value={interiorColour}
              onChange={(e) => setInteriorColour(e.target.value)}
              className={rowControlClass}
            />
          </Row>
          <SelectRow label="Drivetrain">
            <ConstrainedSelect name="drivetrain" options={DRIVETRAINS} value={drivetrain} onChange={setDrivetrain} placeholder="Select" />
          </SelectRow>
          <SelectRow label="Engine layout">
            <ConstrainedSelect
              name="engine_layout"
              options={ENGINE_LAYOUTS}
              value={engineLayout}
              onChange={setEngineLayout}
              placeholder="Select"
            />
          </SelectRow>
        </RowGroup>

        <RowGroup title="Location">
          <SelectRow label="State">
            <ConstrainedSelect name="state" options={NIGERIAN_STATES} value={state} onChange={setState} placeholder="Select state" />
          </SelectRow>
          <Row label="Area">
            <input name="location_area" placeholder="LGA, never a street" className={rowControlClass} />
          </Row>
        </RowGroup>

        <RowGroup title="Description" footer="Equipment only. Drivetrain, colour, mileage and trim have their own fields above. 4MATIC, xDrive and quattro are AWD.">
          <StackedRow label="Key features">
            <input
              name="key_features"
              placeholder="Reverse camera, Leather seats, Sunroof"
              className={stackedControlClass}
            />
          </StackedRow>
          <StackedRow label="Description">
            <textarea
              name="description"
              rows={4}
              placeholder="Clean, accident-free unit. Full service history, new tyres and cold AC. Duty fully paid."
              className={stackedControlClass}
            />
          </StackedRow>
        </RowGroup>

        <RowGroup title="Only you see this" locked footer="Supplier and cost price never appear on the public site.">
          <SupplierPicker
            suppliers={suppliers}
            value={supplierId}
            onChange={setSupplierId}
            onSupplierCreated={(s) => setSuppliers((prev) => [...prev, s])}
            customName={customSupplierName}
            onCustomNameChange={setCustomSupplierName}
          />
          <Row label="Cost price">
            <input name="cost_price_ngn" type="number" inputMode="numeric" min={0} placeholder="₦ amount" className={rowControlClass} />
          </Row>
          <Row label="VIN">
            <input name="vin" autoCapitalize="characters" autoCorrect="off" className={rowControlClass} />
          </Row>
          <Row label="Plate">
            <input name="registration_plate" autoCapitalize="characters" autoCorrect="off" placeholder="Optional" className={rowControlClass} />
          </Row>
          <StackedRow label="Acquisition notes">
            <textarea name="acquisition_notes" rows={2} className={stackedControlClass} />
          </StackedRow>
        </RowGroup>

        <FormError message={error} />
      </div>

      <BottomBar>
        <button type="submit" value="draft" disabled={submitting} className={secondaryButtonClass}>
          {submitIntent === 'draft' ? 'Saving…' : 'Save draft'}
        </button>
        <button type="submit" value="available" disabled={submitting} className={primaryButtonClass}>
          {submitIntent === 'available' ? 'Posting…' : 'Post car'}
        </button>
      </BottomBar>
    </form>
  )
}
