'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Camera, Car as CarIcon, ChevronLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageUploader, type PendingImage } from './ImageUploader'
import { useDiscardUnsavedPhotos } from './useDiscardUnsavedPhotos'
import { removeCarImageFiles } from '@/app/admin/actions'
import { MakeModelFields } from './MakeModelFields'
import { CUSTOM_SUPPLIER, SupplierPicker, createOneOffSupplier } from './SupplierPicker'
import { ConstrainedSelect } from './ConstrainedSelect'
import { CarRowActions, FeaturedSwitch, PositionArrows } from './CarRowActions'
import {
  BottomBar,
  FormError,
  Row,
  RowGroup,
  SelectRow,
  StackedRow,
  bottomBarSpace,
  primaryButtonClass,
  rowClass,
  rowControlClass,
  rowSelectClass,
  stackedControlClass,
} from './FormRows'
import { getCarImagePublicUrl } from '@/lib/images'
import { formatCarTitle, formatMileage, formatNGN, toDisplayCase } from '@/lib/formatters'
import { buildCarFormSchema, formatCarFormErrors } from '@/lib/carFormSchema'
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, ENGINE_LAYOUTS, FUEL_TYPES, TRANSMISSIONS, getYearOptions } from '@/lib/carOptions'
import type { Car, CarImage, Supplier } from '@/lib/supabase/types'

interface CarEditFormProps {
  car: Car
  images: CarImage[]
  suppliers: Pick<Supplier, 'id' | 'name' | 'supplier_type'>[]
  cardTaps: number
  // This car's place in the home page order (-1 when not featured) and the
  // size of that order.
  featuredIndex: number
  featuredCount: number
}

// Draft is not one of the four; a draft shows nothing selected and a banner
// with Publish instead.
const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const

const YEAR_OPTIONS = getYearOptions()

export function CarEditForm({
  car,
  images: initialImages,
  suppliers: initialSuppliers,
  cardTaps,
  featuredIndex,
  featuredCount,
}: CarEditFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<PendingImage[]>(
    initialImages.map((img) => ({
      storagePath: img.storage_path,
      publicUrl: getCarImagePublicUrl(img.storage_path),
      isCover: img.is_cover,
    }))
  )
  const [savedPaths] = useState<ReadonlySet<string>>(() => new Set(initialImages.map((img) => img.storage_path)))
  const markSaved = useDiscardUnsavedPhotos(
    images.map((img) => img.storagePath).filter((path) => !savedPaths.has(path))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [supplierId, setSupplierId] = useState(car.supplier_id)
  const [customSupplierName, setCustomSupplierName] = useState('')
  const [status, setStatus] = useState(car.status)
  const [showPhotos, setShowPhotos] = useState(false)
  const [archiveReason, setArchiveReason] = useState(car.archive_reason ?? '')

  const [make, setMake] = useState(car.make)
  const [model, setModel] = useState(car.model)
  const [variant, setVariant] = useState(car.variant ?? '')
  const [trim, setTrim] = useState(car.trim ?? '')
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

    // The draft banner's Publish saves every change and makes the car
    // available in one go.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const nextStatus: Car['status'] = submitter?.value === 'publish' ? 'available' : status

    if (!supplierId) {
      setError('Select or create a supplier')
      setSaving(false)
      return
    }
    if (supplierId === CUSTOM_SUPPLIER && !customSupplierName.trim()) {
      setError('Enter a supplier name')
      setSaving(false)
      return
    }

    if ((nextStatus === 'available' || nextStatus === 'reserved') && images.length === 0) {
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
      variant,
      trim,
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

    // Photos first, in one transaction: the RPC deletes rows missing from the
    // payload, updates order for rows with an id and inserts the rest. If it
    // fails nothing else is saved, and the unsaved-photo cleanup stays active
    // (no markSaved) so the uploaded files are removed if the admin leaves.
    const imageIds = new Map(initialImages.map((img) => [img.storage_path, img.id]))
    const { data: deletedPaths, error: imagesError } = await supabase.rpc('save_car_images', {
      p_car_id: car.id,
      p_images: images.map((img, index) => {
        const id = imageIds.get(img.storagePath)
        return {
          ...(id && { id }),
          storage_path: img.storagePath,
          is_cover: img.isCover,
          sort_order: index,
        }
      }),
    })

    if (imagesError) {
      console.error('[admin] save_car_images failed', imagesError)
      setError('Photos not saved, try again.')
      setSaving(false)
      router.refresh()
      return
    }

    // The photos are saved from here on. The refresh hands the form the new
    // photo rows, so a retry matches them by id instead of inserting them again.
    function detailsNotSaved() {
      setError('Photos saved. Details not saved, try again.')
      setSaving(false)
      router.refresh()
    }

    let resolvedSupplierId = supplierId
    if (supplierId === CUSTOM_SUPPLIER) {
      try {
        resolvedSupplierId = await createOneOffSupplier(customSupplierName)
      } catch {
        detailsNotSaved()
        return
      }
    }

    const { error: updateError } = await supabase
      .from('cars')
      .update({
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
        exterior_colour: String(form.get('exterior_colour') ?? '').trim() || null,
        interior_colour: String(form.get('interior_colour') ?? '').trim() || null,
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
        status: nextStatus,
        archive_reason: nextStatus === 'sold' || nextStatus === 'withdrawn' ? archiveReason || null : null,
        acquisition_notes: (form.get('acquisition_notes') as string) || null,
      })
      .eq('id', car.id)

    if (updateError) {
      detailsNotSaved()
      return
    }

    // The files go only once their rows are gone and the details are saved.
    if (deletedPaths.length > 0) {
      void removeCarImageFiles(deletedPaths)
    }

    markSaved()
    router.push('/admin')
    router.refresh()
  }

  const isTerminal = status === 'sold' || status === 'withdrawn'
  const hasLegacyYear = !YEAR_OPTIONS.includes(car.year)

  const title = formatCarTitle(car)
  const meta = [formatMileage(car.mileage_km), toDisplayCase(car.transmission), toDisplayCase(car.fuel_type)]
    .filter(Boolean)
    .join(' · ')
  const cover = images.find((img) => img.isCover) ?? images[0]
  // The public view lists available, reserved and sold cars.
  const isPublic = ['available', 'reserved', 'sold'].includes(car.status)
  const rowCar = {
    id: car.id,
    status: car.status,
    is_featured: car.is_featured,
    last_verified_at: car.last_verified_at,
  }
  const sectionTitleClass = 'px-1 font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted'

  return (
    <form onSubmit={handleSubmit} data-lock-overscroll className="md:max-w-2xl">
      <div className={`flex flex-col gap-[22px] ${bottomBarSpace}`}>
        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-fill md:rounded-2xl">
            {cover ? (
              <Image
                src={cover.publicUrl}
                alt={`${title}, cover photo`}
                fill
                priority
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-text-muted">
                <CarIcon size={56} strokeWidth={1.2} aria-hidden="true" />
              </span>
            )}
          </div>
          {/* Fixed on phones so they stay reachable while the form scrolls. */}
          <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+8px)] z-40 flex justify-between md:absolute md:top-4">
            <Link
              href="/admin"
              aria-label="Back to inventory"
              className="glass flex size-11 items-center justify-center rounded-full text-ink"
            >
              <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
            </Link>
            {isPublic && (
              <a
                href={`/cars/${car.slug}`}
                target="_blank"
                rel="noopener"
                aria-label="View public listing"
                className="glass flex size-11 items-center justify-center rounded-full text-ink"
              >
                <ExternalLink size={19} strokeWidth={1.9} aria-hidden="true" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowPhotos((open) => !open)}
            aria-expanded={showPhotos}
            aria-controls="edit-photos"
            className="glass absolute right-4 bottom-4 flex h-11 items-center gap-1.5 rounded-full px-3.5 font-body text-sm font-semibold text-ink"
          >
            <Camera size={16} strokeWidth={1.8} aria-hidden="true" />
            {showPhotos ? 'Done' : 'Edit photos'}
          </button>
        </div>

        <div className="flex flex-col gap-[22px] px-4 md:px-0">
          {showPhotos && (
            <div id="edit-photos">
              <ImageUploader folderId={`car-${car.id}`} images={images} savedPaths={savedPaths} onChange={setImages} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[26px] font-extrabold leading-[1.1] tracking-display">{title}</h1>
            <p className="font-display text-xl font-bold tracking-[-0.01em] tabular-nums">
              {formatNGN(car.asking_price_ngn)}
            </p>
            {meta && <p className="font-body text-[15px] text-text-muted">{meta}</p>}
          </div>

          {status === 'draft' && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface py-2 pr-2 pl-4">
              <p className="font-body text-[15px] text-ink">
                <span className="font-semibold">Draft.</span> Not on the public site yet.
              </p>
              <button
                type="submit"
                value="publish"
                disabled={saving}
                className="h-11 shrink-0 rounded-full bg-ink px-4 font-body text-[15px] font-bold text-ink-inverse disabled:opacity-60"
              >
                Publish
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-0.5 rounded-2xl bg-surface p-3.5">
              <span className="font-body text-[13px] text-text-muted">Card taps</span>
              <span className="font-display text-[22px] font-bold tabular-nums">{cardTaps}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-2xl bg-surface p-3.5">
              <span className="font-body text-[13px] text-text-muted">Home page</span>
              <span className="font-display text-[22px] font-bold">
                {car.is_featured ? `Featured #${featuredIndex + 1}` : 'Not featured'}
              </span>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={`mb-2 ${sectionTitleClass}`}>Status</legend>
            <div className="grid grid-cols-4 gap-0.5 rounded-[14px] bg-fill p-[3px]">
              {STATUSES.map(({ value, label }) => (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name="status_choice"
                    value={value}
                    checked={status === value}
                    onChange={() => setStatus(value)}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 cursor-pointer items-center justify-center rounded-[11px] font-body text-sm font-medium text-ink transition-colors duration-200 peer-checked:bg-segment peer-checked:font-bold peer-checked:shadow-[0_1px_3px_rgba(0,0,0,0.12)] peer-focus-visible:outline-2 peer-focus-visible:outline-ink">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {isTerminal && (
            <RowGroup title="Archive">
              <Row label="Reason">
                <input
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder={status === 'sold' ? 'Sold to walk-in buyer' : 'Sold at source'}
                  className={rowControlClass}
                />
              </Row>
            </RowGroup>
          )}

          <section className="flex flex-col gap-2">
            <h2 className={sectionTitleClass}>Verification</h2>
            <div className="flex min-h-[60px] items-center rounded-2xl bg-surface py-2 pr-2 pl-4">
              <CarRowActions
                car={rowCar}
                hasPhoto={images.length > 0}
                featuredIndex={featuredIndex}
                featuredCount={featuredCount}
                section="verified"
              />
            </div>
          </section>

          <RowGroup title="Featured">
            <div className={`${rowClass} justify-between pr-2`}>
              <span className="font-body text-base">Show on home page</span>
              <FeaturedSwitch car={rowCar} label="Show on home page" />
            </div>
            {car.is_featured && (
              <div className={`${rowClass} justify-between pr-2`}>
                <span className="font-body text-base">Position</span>
                <PositionArrows car={rowCar} featuredIndex={featuredIndex} featuredCount={featuredCount} />
              </div>
            )}
          </RowGroup>

          <RowGroup title="Details">
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
                {hasLegacyYear && <option value={car.year}>{car.year} (existing value, outside current range)</option>}
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </SelectRow>
            <Row label="Asking price">
              <input
                name="asking_price_ngn"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={car.asking_price_ngn}
                required
                className={rowControlClass}
              />
            </Row>
            <SelectRow label="Condition">
              <ConstrainedSelect
                name="condition"
                options={CONDITIONS}
                value={condition}
                onChange={setCondition}
                placeholder="Select"
                legacyValue={car.condition}
              />
            </SelectRow>
            <SelectRow label="Body type">
              <ConstrainedSelect
                name="body_type"
                options={BODY_TYPES}
                value={bodyType}
                onChange={setBodyType}
                placeholder="Select"
                legacyValue={car.body_type}
              />
            </SelectRow>
            <SelectRow label="Transmission">
              <ConstrainedSelect
                name="transmission"
                options={TRANSMISSIONS}
                value={transmission}
                onChange={setTransmission}
                placeholder="Select"
                legacyValue={car.transmission}
              />
            </SelectRow>
            <SelectRow label="Fuel type">
              <ConstrainedSelect
                name="fuel_type"
                options={FUEL_TYPES}
                value={fuelType}
                onChange={setFuelType}
                placeholder="Select"
                legacyValue={car.fuel_type}
              />
            </SelectRow>
            <Row label="Mileage">
              <input
                name="mileage_km"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={car.mileage_km ?? ''}
                placeholder="km"
                className={rowControlClass}
              />
            </Row>
            <Row label="Exterior">
              <input name="exterior_colour" defaultValue={car.exterior_colour ?? ''} placeholder="Colour" className={rowControlClass} />
            </Row>
            <Row label="Interior">
              <input name="interior_colour" defaultValue={car.interior_colour ?? ''} placeholder="Colour" className={rowControlClass} />
            </Row>
            <SelectRow label="Drivetrain">
              <ConstrainedSelect
                name="drivetrain"
                options={DRIVETRAINS}
                value={drivetrain}
                onChange={setDrivetrain}
                placeholder="Select"
                legacyValue={car.drivetrain}
              />
            </SelectRow>
            <SelectRow label="Engine layout">
              <ConstrainedSelect
                name="engine_layout"
                options={ENGINE_LAYOUTS}
                value={engineLayout}
                onChange={setEngineLayout}
                placeholder="Select"
                legacyValue={car.engine_layout}
              />
            </SelectRow>
            <Row label="Location">
              <input
                name="location_area"
                defaultValue={car.location_area ?? ''}
                placeholder="LGA, never a street"
                className={rowControlClass}
              />
            </Row>
          </RowGroup>

          <RowGroup title="Description" footer="Equipment only. Drivetrain, colour, mileage and trim have their own fields above. 4MATIC, xDrive and quattro are AWD.">
            <StackedRow label="Key features">
              <input
                name="key_features"
                defaultValue={(car.key_features ?? []).join(', ')}
                placeholder="Reverse camera, Leather seats, Sunroof"
                className={stackedControlClass}
              />
            </StackedRow>
            <StackedRow label="Description">
              <textarea name="description" rows={4} defaultValue={car.description ?? ''} className={stackedControlClass} />
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
              <input
                name="cost_price_ngn"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={car.cost_price_ngn ?? ''}
                placeholder="₦ amount"
                className={rowControlClass}
              />
            </Row>
            <Row label="VIN">
              <input name="vin" defaultValue={car.vin ?? ''} autoCapitalize="characters" autoCorrect="off" className={rowControlClass} />
            </Row>
            <Row label="Plate">
              <input
                name="registration_plate"
                defaultValue={car.registration_plate ?? ''}
                autoCapitalize="characters"
                autoCorrect="off"
                placeholder="Optional"
                className={rowControlClass}
              />
            </Row>
            <StackedRow label="Acquisition notes">
              <textarea name="acquisition_notes" rows={2} defaultValue={car.acquisition_notes ?? ''} className={stackedControlClass} />
            </StackedRow>
          </RowGroup>

          <FormError message={error} />
        </div>
      </div>

      <BottomBar>
        <button type="submit" disabled={saving} className={`${primaryButtonClass} flex-1`}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </BottomBar>
    </form>
  )
}
