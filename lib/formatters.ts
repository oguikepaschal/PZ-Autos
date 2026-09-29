import { formatDistanceToNow, format } from 'date-fns'

// --- Price formatting ---
// PZ Autos runs one currency, one price. PostgREST returns `numeric` columns
// as JSON numbers; strings are still accepted for values read from form
// inputs or other sources.

export function formatNGN(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

// --- Mileage ---

export function formatMileage(km: number | null | undefined): string {
  if (km === null || km === undefined) return 'Mileage on request'
  if (km === 0) return '0 km'
  return `${new Intl.NumberFormat('en-US').format(km)} km`
}

// --- Dates ---

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

// --- Phone normalization ---
// Normalizes Nigerian numbers to E.164 format.
// Handles: 08012345678, +2348012345678, 2348012345678

export function normalizeNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  if (digits.startsWith('234') && digits.length === 13) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.slice(1)}`
  }

  if (digits.length === 10) {
    return `+234${digits}`
  }

  // Return as-is with + if already looks international
  return raw.startsWith('+') ? raw : `+${digits}`
}

// A normalized phone is at minimum plausible if it has enough digits to be a
// real number at all — catches obvious truncation/typos (e.g. a dropped
// digit) regardless of which country's number it claims to be.
export function isPlausiblePhoneNumber(normalized: string): boolean {
  return normalized.replace(/\D/g, '').length >= 10
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return ''
  if (phone.includes(' ')) return phone
  const ngMatch = phone.match(/^\+234(\d{3})(\d{3})(\d{4})$/)
  if (ngMatch) return `+234 ${ngMatch[1]} ${ngMatch[2]} ${ngMatch[3]}`
  return phone
}

// --- Name display helpers ---

export function getInitials(fullName: string | null | undefined): string {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]!.charAt(0)
  const last = words[words.length - 1]!.charAt(0)
  return (words.length === 1 ? first : first + last).toUpperCase()
}

// --- Car display helpers ---

const AUTOMOTIVE_CASE_MAP: Record<string, string> = {
  bmw: 'BMW',
  amg: 'AMG',
  awd: 'AWD',
  rwd: 'RWD',
  fwd: 'FWD',
  suv: 'SUV',
  gtb: 'GTB',
  gts: 'GTS',
  gtr: 'GTR',
  svj: 'SVJ',
  gt3: 'GT3',
  rs: 'RS',
  gle: 'GLE',
  glc: 'GLC',
  gls: 'GLS',
  gla: 'GLA',
  glb: 'GLB',
  slk: 'SLK',
  sls: 'SLS',
  cls: 'CLS',
  cla: 'CLA',
  slc: 'SLC',
  rx: 'RX',
  lx: 'LX',
  phev: 'PHEV',
  ev: 'EV',
  hev: 'HEV',
  '4matic+': '4Matic+',
  '4matic': '4Matic',
  xdrive: 'xDrive',
  quattro: 'Quattro',
  v6: 'V6',
  v8: 'V8',
  v10: 'V10',
  v12: 'V12',
}

// Sorted longest-first so prefix matching prefers the most specific key
// (e.g. "4matic+" before "4matic").
const SORTED_PREFIX_KEYS = Object.keys(AUTOMOTIVE_CASE_MAP).sort((a, b) => b.length - a.length)

function applyAutomotiveCase(word: string): string {
  const lower = word.toLowerCase()

  if (lower in AUTOMOTIVE_CASE_MAP) return AUTOMOTIVE_CASE_MAP[lower]!

  for (const key of SORTED_PREFIX_KEYS) {
    if (lower.startsWith(key) && lower.length > key.length) {
      return AUTOMOTIVE_CASE_MAP[key]! + lower.slice(key.length)
    }
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function toDisplayCase(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .split(' ')
    .map((word) => word.split('-').map(applyAutomotiveCase).join('-'))
    .join(' ')
}

// Make/model are shown exactly as entered — never re-cased. Real model
// names carry acronyms, Roman numerals and mixed case ("III", "AMG", "SVJ",
// "GT3 RS") that any title-case pass corrupts.
export function formatCarTitle(make: string, model: string, year: number): string {
  return `${year} ${make} ${model}`
}

// --- Verification freshness ---
// The owner does not hold this inventory — a car can sell elsewhere without
// notice, so a stale listing is a real operational risk, not cosmetic. Two
// tiers: 14 days is the tightest cadence a solo operator can sustain across
// a full inventory; 30 days is the point it stops being "due" and starts
// being neglected.

export const STALE_THRESHOLD_DAYS = 14
export const CRITICALLY_STALE_THRESHOLD_DAYS = 30

export type FreshnessTier = 'fresh' | 'stale' | 'critical'

export function getFreshnessTier(lastVerifiedAt: string | Date): FreshnessTier {
  const ageMs = Date.now() - new Date(lastVerifiedAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays >= CRITICALLY_STALE_THRESHOLD_DAYS) return 'critical'
  if (ageDays >= STALE_THRESHOLD_DAYS) return 'stale'
  return 'fresh'
}
