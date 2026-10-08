'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CUSTOM_SUPPLIER, SupplierPicker, createOneOffSupplier } from './SupplierPicker'
import { ImageUploader, type PendingImage } from './ImageUploader'
import { MakeModelFields } from './MakeModelFields'
import { ConstrainedSelect } from './ConstrainedSelect'
import { SuggestionChip } from './SuggestionChip'
import { Field } from './FormField'
import { createCarWithImages } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'
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
  TRANSMISSIONS,
  getYearOptions,
} from '@/lib/carOptions'
import type { Supplier } from '@/lib/supabase/types'

interface CarFormProps {
  suppliers: Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]
}

const YEAR_OPTIONS = getYearOptions()

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [transmission, setTransmission] = useState<string>(DEFAULT_TRANSMISSION)
  const [fuelType, setFuelType] = useState<string>(DEFAULT_FUEL_TYPE)
  const [drivetrain, setDrivetrain] = useState('')
  const [engineLayout, setEngineLayout] = useState<string>(DEFAULT_ENGINE_LAYOUT)
  const [condition, setCondition] = useState<string>(DEFAULT_CONDITION)
  // Controlled like every other suggestible field. These two were read out of
  // FormData at submit time, which is fine for typing but leaves nothing for a
  // suggestion to write into. Empty string still submits as null, exactly as
  // the FormData read did.
  const [exteriorColour, setExteriorColour] = useState('')
  const [interiorColour, setInteriorColour] = useState('')
  const [status, setStatus] = useState<'draft' | 'available' | 'reserved'>('draft')
  const [featureOnCreate, setFeatureOnCreate] = useState(false)
  const canFeature = status !== 'draft'

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
          body: JSON.stringify({ make: trimmedMake, model: trimmedModel, year: Number(year) }),
          signal: controller.signal,
        })
        if (!res.ok) return

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
  }, [make, model, year])

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
      year,
      body_type: bodyType,
      transmission,
      fuel_type: fuelType,
      drivetrain,
      engine_layout: engineLayout,
      condition,
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

    try {
      const slug = generateCarSlug(parsed.data.year, parsed.data.make, parsed.data.model)

      const resolvedSupplierId =
        supplierId === CUSTOM_SUPPLIER ? await createOneOffSupplier(customSupplierName) : supplierId

      const carId = await createCarWithImages(
        folderId,
        {
          slug,
          supplier_id: resolvedSupplierId,
          make: parsed.data.make,
          model: parsed.data.model,
          year: parsed.data.year,
          body_type: parsed.data.body_type,
          transmission: parsed.data.transmission,
          fuel_type: parsed.data.fuel_type,
          mileage_km: form.get('mileage_km') ? Number(form.get('mileage_km')) : null,
          exterior_colour: exteriorColour || null,
          interior_colour: interiorColour || null,
          engine_layout: parsed.data.engine_layout,
          drivetrain: parsed.data.drivetrain,
          condition: parsed.data.condition,
          description: (form.get('description') as string) || null,
          key_features: keyFeaturesRaw
            ? keyFeaturesRaw.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined,
          location_area: (form.get('location_area') as string) || null,
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

      if (featureOnCreate && canFeature) {
        // The car row is already committed at this point — a failure here
        // shouldn't undo the creation or block navigation, it just means
        // the admin features it from /admin instead.
        const { error: featureError } = await createClient().rpc('set_car_featured', {
          p_car_id: carId,
          p_featured: true,
        })
        if (featureError) console.error(featureError)
      }

      router.push('/admin')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Could not save this car. Nothing was created — check the fields and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-lock-overscroll className="space-y-6 max-w-2xl">
      <Field label="Supplier">
        <SupplierPicker
          suppliers={suppliers}
          value={supplierId}
          onChange={setSupplierId}
          onSupplierCreated={(s) => setSuppliers((prev) => [...prev, s])}
          customName={customSupplierName}
          onCustomNameChange={setCustomSupplierName}
        />
      </Field>

      <Field label="Photos">
        <ImageUploader folderId={folderId} images={images} onChange={setImages} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <MakeModelFields make={make} model={model} onMakeChange={setMake} onModelChange={setModel} />
        <Field label="Year">
          <select
            name="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-ink"
          >
            <option value="">Select year…</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Asking price (₦)"><Input name="asking_price_ngn" type="number" min={1} required placeholder="e.g. ₦12,500,000" /></Field>
        <Field label="Cost price (₦, admin only)"><Input name="cost_price_ngn" type="number" min={0} placeholder="e.g. ₦10,000,000" /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Body type">
          <ConstrainedSelect
            name="body_type"
            options={BODY_TYPES}
            value={bodyType}
            onChange={setBodyType}
            placeholder="Select body type…"
          />
          <SuggestionChip value={specSuggestions.body_type ?? null} onAccept={setBodyType} />
        </Field>
        <Field label="Condition">
          <ConstrainedSelect
            name="condition"
            options={CONDITIONS}
            value={condition}
            onChange={setCondition}
            placeholder="Select condition…"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Transmission">
          <ConstrainedSelect
            name="transmission"
            options={TRANSMISSIONS}
            value={transmission}
            onChange={setTransmission}
            placeholder="Select transmission…"
          />
        </Field>
        <Field label="Fuel type">
          <ConstrainedSelect
            name="fuel_type"
            options={FUEL_TYPES}
            value={fuelType}
            onChange={setFuelType}
            placeholder="Select fuel type…"
          />
        </Field>
        <Field label="Mileage (km)"><Input name="mileage_km" type="number" min={0} placeholder="e.g. 50,000" /></Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Exterior colour">
          <Input
            name="exterior_colour"
            placeholder="e.g. Beige"
            value={exteriorColour}
            onChange={(e) => setExteriorColour(e.target.value)}
          />
          <SuggestionChip
            value={colourSuggestions.exterior_colour ?? null}
            onAccept={setExteriorColour}
          />
        </Field>
        <Field label="Interior colour">
          <Input
            name="interior_colour"
            placeholder="e.g. White"
            value={interiorColour}
            onChange={(e) => setInteriorColour(e.target.value)}
          />
          <SuggestionChip
            value={colourSuggestions.interior_colour ?? null}
            onAccept={setInteriorColour}
          />
        </Field>
        <Field label="Drivetrain">
          <ConstrainedSelect
            name="drivetrain"
            options={DRIVETRAINS}
            value={drivetrain}
            onChange={setDrivetrain}
            placeholder="Select drivetrain…"
          />
          <SuggestionChip value={specSuggestions.drivetrain ?? null} onAccept={setDrivetrain} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Engine layout">
          <ConstrainedSelect
            name="engine_layout"
            options={ENGINE_LAYOUTS}
            value={engineLayout}
            onChange={setEngineLayout}
            placeholder="Select engine layout…"
          />
          <SuggestionChip value={specSuggestions.engine_layout ?? null} onAccept={setEngineLayout} />
        </Field>
        <Field label="Location (LGA — never a street address)"><Input name="location_area" placeholder="Ikeja" /></Field>
      </div>

      <Field label="Key features (comma-separated)">
        <Input name="key_features" placeholder="Reverse camera, Leather seats, Sunroof" />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={4}
          placeholder="e.g. Clean, accident-free unit in beige with a white leather interior. 50,000 km on the clock, full service history, new tyres and cold AC. Duty fully paid."
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-ink"
        />
      </Field>

      <Field label="VIN (admin only)"><Input name="vin" /></Field>

      <details className="rounded-lg border border-hairline px-3 py-2">
        <summary className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted cursor-pointer py-3.5">
          Registration plate (optional, admin only)
        </summary>
        <div className="mt-2">
          <Input name="registration_plate" />
        </div>
      </details>

      <Field label="Acquisition notes (admin only)">
        <textarea
          name="acquisition_notes"
          rows={2}
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-ink"
        />
      </Field>

      <Field label="Status">
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="border border-hairline rounded-lg px-3 py-2 font-body text-ink"
        >
          <option value="draft">Draft (not public yet)</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
        </select>
      </Field>

      <label className="flex min-h-11 items-center gap-2 font-body text-sm text-ink">
        <input
          type="checkbox"
          checked={featureOnCreate}
          disabled={!canFeature}
          onChange={(e) => setFeatureOnCreate(e.target.checked)}
          className="disabled:opacity-40"
        />
        Feature on the homepage
        {!canFeature && (
          <span className="font-body text-xs text-text-muted">
            (only available/reserved cars can be featured)
          </span>
        )}
      </label>

      {error && <p className="font-body text-sm text-signal-red">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-6 py-3 disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Save car'}
      </button>
    </form>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-ink"
    />
  )
}
