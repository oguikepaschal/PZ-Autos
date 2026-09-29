// Single source of truth for every constrained car-attribute dropdown in the
// admin forms (CarForm, CarEditForm) and the Zod schema that validates them
// (lib/carFormSchema.ts). Add a new option here, not in either form.

export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_YEAR = 1990

// Descending (newest first) — how a buyer/admin expects a year picker to
// read. Generated, not hardcoded, so it never needs a yearly edit.
export function getYearOptions(): number[] {
  const years: number[] = []
  for (let year = CURRENT_YEAR + 1; year >= MIN_YEAR; year--) {
    years.push(year)
  }
  return years
}

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const
export type FuelType = (typeof FUEL_TYPES)[number]
export const DEFAULT_FUEL_TYPE: FuelType = 'Petrol'

export const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'] as const
export type Transmission = (typeof TRANSMISSIONS)[number]
export const DEFAULT_TRANSMISSION: Transmission = 'Automatic'

export const DRIVETRAINS = ['FWD', 'RWD', 'AWD', '4WD'] as const
export type Drivetrain = (typeof DRIVETRAINS)[number]

// Cylinder/motor layout. Replaces the old free-text `engine` field (removed
// via migration 20260902000006) rather than sitting alongside it.
export const ENGINE_LAYOUTS = ['I3', 'I4', 'I5', 'I6', 'V6', 'V8', 'V10', 'V12', 'Electric'] as const
export type EngineLayout = (typeof ENGINE_LAYOUTS)[number]
export const DEFAULT_ENGINE_LAYOUT: EngineLayout = 'V6'

export const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Bus'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export const CONDITIONS = ['New', 'Foreign Used', 'Local Used'] as const
export type Condition = (typeof CONDITIONS)[number]
export const DEFAULT_CONDITION: Condition = 'Foreign Used'

// Starter list of common Nigerian-market makes/models — not exhaustive.
// Inventory is broker-sourced and not limited to these brands, so the
// Make/Model combobox (components/admin/MakeModelFields.tsx) always allows
// free entry for anything not in this list.
export const CAR_MAKES_WITH_MODELS: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'Highlander', 'RAV4', 'Land Cruiser', 'Hilux', 'Sienna', 'Venza', 'Prado', 'Avalon'],
  Lexus: ['RX', 'ES', 'GX', 'LX', 'NX', 'IS'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLA', 'G-Class'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X6'],
  Ford: ['Explorer', 'Edge', 'F-150', 'Expedition'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent'],
  Kia: ['Rio', 'Sportage', 'Sorento', 'Optima', 'Cerato'],
  Nissan: ['Altima', 'Maxima', 'Murano', 'Pathfinder', 'Rogue'],
  'Land Rover': ['Range Rover', 'Range Rover Sport', 'Discovery', 'Defender'],
  Peugeot: ['307', '407', '508', '3008', '5008'],
  Volkswagen: ['Passat', 'Tiguan', 'Golf', 'Jetta'],
  Mitsubishi: ['Outlander', 'Pajero', 'L200'],
  Audi: ['A4', 'A6', 'Q5', 'Q7'],
  Acura: ['MDX', 'RDX', 'TLX'],
  Infiniti: ['QX60', 'QX80', 'Q50'],
  Volvo: ['XC60', 'XC90', 'S60'],
  Chevrolet: ['Malibu', 'Tahoe', 'Suburban'],
  Jeep: ['Grand Cherokee', 'Cherokee', 'Wrangler'],
}

export const CAR_MAKES = Object.keys(CAR_MAKES_WITH_MODELS).sort()
