'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader, type PendingImage } from './ImageUploader'
import { MakeModelFields } from './MakeModelFields'
import { SupplierPicker } from './SupplierPicker'
import { ConstrainedSelect } from './ConstrainedSelect'
import { Field } from './FormField'
import { getCarImagePublicUrl } from '@/lib/images'
import { buildCarFormSchema, formatCarFormErrors } from '@/lib/carFormSchema'
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, ENGINE_LAYOUTS, FUEL_TYPES, TRANSMISSIONS, getYearOptions } from '@/lib/carOptions'
import type { Car, CarImage, Supplier } from '@/lib/supabase/types'

interface CarEditFormProps {
  car: Car
  images: CarImage[]
  suppliers: Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]
}

const YEAR_OPTIONS = getYearOptions()

export function CarEditForm({ car, images: initialImages, suppliers: initialSuppliers }: CarEditFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<PendingImage[]>(
    initialImages.map((img) => ({
      storagePath: img.storage_path,
      publicUrl: getCarImagePublicUrl(img.storage_path),
      isCover: img.is_cover,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [supplierId, setSupplierId] = useState(car.supplier_id)
  const [status, setStatus] = useState(car.status)
  const [archiveReason, setArchiveReason] = useState(car.archive_reason ?? '')

  const [make, setMake] = useState(car.make)
  const [model, setModel] = useState(car.model)
  // The year dropdown only spans MIN_YEAR..CURRENT_YEAR+1; a record saved
  // outside that window (or before this dropdown existed) still needs to
  // show its real value rather than silently falling back to blank.
  const [year, setYear] = useState(String(car.year))
  const [bodyType, setBodyType] = useState(car.body_type ?? '')
  const [transmission, setTransmission] = useState(car.transmission ?? '')
  const [fuelType, setFuelType] = useState(car.fuel_type ?? '')
  const [drivetrain, setDrivetrain] = useState(car.drivetrain ?? '')
  const [engineLayout, setEngineLayout] = useState(car.engine_layout ?? '')
  const [condition, setCondition] = useState(car.condition ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!supplierId) {
      setError('Select or create a supplier')
      setSaving(false)
      return
    }

    if ((status === 'available' || status === 'reserved') && images.length === 0) {
      setError('Add at least one photo to publish')
      setSaving(false)
      return
    }

    const form = new FormData(e.currentTarget)
    const keyFeatures = String(form.get('key_features') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const parsed = buildCarFormSchema({
      body_type: car.body_type,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      drivetrain: car.drivetrain,
      engine_layout: car.engine_layout,
      condition: car.condition,
    }).safeParse({
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
      setSaving(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('cars')
      .update({
        supplier_id: supplierId,
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year,
        body_type: parsed.data.body_type,
        transmission: parsed.data.transmission,
        fuel_type: parsed.data.fuel_type,
        mileage_km: form.get('mileage_km') ? Number(form.get('mileage_km')) : null,
        exterior_colour: (form.get('exterior_colour') as string) || null,
        interior_colour: (form.get('interior_colour') as string) || null,
        engine_layout: parsed.data.engine_layout,
        drivetrain: parsed.data.drivetrain,
        condition: parsed.data.condition,
        description: (form.get('description') as string) || null,
        key_features: keyFeatures.length > 0 ? keyFeatures : null,
        location_area: (form.get('location_area') as string) || null,
        vin: (form.get('vin') as string) || null,
        registration_plate: (form.get('registration_plate') as string) || null,
        cost_price_ngn: form.get('cost_price_ngn') ? Number(form.get('cost_price_ngn')) : null,
        asking_price_ngn: Number(form.get('asking_price_ngn')),
        status,
        archive_reason: status === 'sold' || status === 'withdrawn' ? archiveReason || null : null,
        acquisition_notes: (form.get('acquisition_notes') as string) || null,
      })
      .eq('id', car.id)

    if (updateError) {
      setError('Could not save changes.')
      setSaving(false)
      return
    }

    // Reconcile car_images against the current `images` state: delete rows
    // no longer present, insert new ones, sync cover/order for the rest.
    const currentPaths = new Set(images.map((img) => img.storagePath))
    const originalPaths = new Set(initialImages.map((img) => img.storage_path))

    const toDelete = initialImages.filter((img) => !currentPaths.has(img.storage_path))
    const toInsert = images.filter((img) => !originalPaths.has(img.storagePath))
    const toUpdate = images.filter((img) => originalPaths.has(img.storagePath))

    if (toDelete.length > 0) {
      await supabase
        .from('car_images')
        .delete()
        .in('id', toDelete.map((img) => img.id))
    }

    for (const img of toInsert) {
      await supabase.from('car_images').insert({
        car_id: car.id,
        storage_path: img.storagePath,
        is_cover: img.isCover,
        sort_order: images.indexOf(img),
      })
    }

    for (const img of toUpdate) {
      const original = initialImages.find((o) => o.storage_path === img.storagePath)!
      const newSortOrder = images.indexOf(img)
      if (original.is_cover !== img.isCover || original.sort_order !== newSortOrder) {
        await supabase
          .from('car_images')
          .update({ is_cover: img.isCover, sort_order: newSortOrder })
          .eq('id', original.id)
      }
    }

    router.push('/admin')
    router.refresh()
  }

  const isTerminal = status === 'sold' || status === 'withdrawn'
  const hasLegacyYear = !YEAR_OPTIONS.includes(car.year)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Field label="Supplier">
        <SupplierPicker
          suppliers={suppliers}
          value={supplierId}
          onChange={setSupplierId}
          onSupplierCreated={(s) => setSuppliers((prev) => [...prev, s])}
        />
      </Field>

      <Field label="Photos">
        <ImageUploader
          folderId={`car-${car.id}`}
          images={images}
          onChange={setImages}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <MakeModelFields make={make} model={model} onMakeChange={setMake} onModelChange={setModel} />
        <Field label="Year">
          <select
            name="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
          >
            <option value="">Select year…</option>
            {hasLegacyYear && (
              <option value={car.year}>{car.year} (existing value, outside current range)</option>
            )}
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Asking price (₦)">
          <Input name="asking_price_ngn" type="number" defaultValue={car.asking_price_ngn} required />
        </Field>
        <Field label="Cost price (₦, admin only)">
          <Input name="cost_price_ngn" type="number" defaultValue={car.cost_price_ngn ?? ''} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Body type">
          <ConstrainedSelect
            name="body_type"
            options={BODY_TYPES}
            value={bodyType}
            onChange={setBodyType}
            placeholder="Select body type…"
            legacyValue={car.body_type}
          />
        </Field>
        <Field label="Condition">
          <ConstrainedSelect
            name="condition"
            options={CONDITIONS}
            value={condition}
            onChange={setCondition}
            placeholder="Select condition…"
            legacyValue={car.condition}
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
            legacyValue={car.transmission}
          />
        </Field>
        <Field label="Fuel type">
          <ConstrainedSelect
            name="fuel_type"
            options={FUEL_TYPES}
            value={fuelType}
            onChange={setFuelType}
            placeholder="Select fuel type…"
            legacyValue={car.fuel_type}
          />
        </Field>
        <Field label="Mileage (km)"><Input name="mileage_km" type="number" defaultValue={car.mileage_km ?? ''} /></Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Exterior colour"><Input name="exterior_colour" defaultValue={car.exterior_colour ?? ''} /></Field>
        <Field label="Interior colour"><Input name="interior_colour" defaultValue={car.interior_colour ?? ''} /></Field>
        <Field label="Drivetrain">
          <ConstrainedSelect
            name="drivetrain"
            options={DRIVETRAINS}
            value={drivetrain}
            onChange={setDrivetrain}
            placeholder="Select drivetrain…"
            legacyValue={car.drivetrain}
          />
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
            legacyValue={car.engine_layout}
          />
        </Field>
        <Field label="Location (LGA)"><Input name="location_area" defaultValue={car.location_area ?? ''} /></Field>
      </div>

      <Field label="Key features (comma-separated)">
        <Input
          name="key_features"
          defaultValue={(car.key_features ?? []).join(', ')}
          placeholder="Reverse camera, Leather seats, Sunroof"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={4}
          defaultValue={car.description ?? ''}
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
        />
      </Field>

      <Field label="VIN (admin only)"><Input name="vin" defaultValue={car.vin ?? ''} /></Field>

      <details className="rounded-lg border border-hairline px-3 py-2" open={Boolean(car.registration_plate)}>
        <summary className="font-body text-xs font-semibold uppercase tracking-wide text-text-muted cursor-pointer">
          Registration plate (optional, admin only)
        </summary>
        <div className="mt-2">
          <Input name="registration_plate" defaultValue={car.registration_plate ?? ''} />
        </div>
      </details>

      <Field label="Acquisition notes (admin only)">
        <textarea
          name="acquisition_notes"
          rows={2}
          defaultValue={car.acquisition_notes ?? ''}
          className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
        />
      </Field>

      <Field label="Status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Car['status'])}
          className="border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
        >
          <option value="draft">Draft</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold — brokered by me</option>
          <option value="withdrawn">Withdrawn — gone elsewhere / delisted</option>
        </select>
      </Field>

      {isTerminal && (
        <Field label="Archive reason">
          <Input
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            placeholder={status === 'sold' ? 'e.g. sold to walk-in buyer' : 'e.g. sold at source before enquiry'}
          />
        </Field>
      )}

      {error && <p className="font-body text-sm text-signal-red">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-signal-red text-white font-body font-semibold text-sm px-6 py-3 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-hairline rounded-lg px-3 py-2 font-body text-sm text-ink"
    />
  )
}
