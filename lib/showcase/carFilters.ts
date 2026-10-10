import type { PublicCarCardData } from './types'

export type SearchParams = Record<string, string | string[] | undefined>

export interface CarFilters {
  make: string
  model: string
  yearFrom: number | null
  yearTo: number | null
}

export interface CarFilterOptions {
  makes: string[]
  modelsByMake: Record<string, string[]>
  years: number[]
}

export interface CarFilterResult {
  filters: CarFilters
  options: CarFilterOptions
  cars: PublicCarCardData[]
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const unique = <T,>(values: T[]) => [...new Set(values)]

// Options come only from the cars passed in, which are the publicly visible
// ones. A param that names something not among them (a make no longer in
// stock, a hand-edited year) is dropped rather than raising an error.
export function applyCarFilters(allCars: PublicCarCardData[], params: SearchParams): CarFilterResult {
  const makes = unique(allCars.map((car) => car.make)).sort((a, b) => a.localeCompare(b))
  const years = unique(allCars.map((car) => car.year)).sort((a, b) => a - b)

  const requestedMake = first(params.make) ?? ''
  const make = makes.includes(requestedMake) ? requestedMake : ''

  const modelsByMake: Record<string, string[]> = {}
  for (const name of makes) {
    modelsByMake[name] = unique(allCars.filter((car) => car.make === name).map((car) => car.model)).sort((a, b) =>
      a.localeCompare(b)
    )
  }
  const requestedModel = first(params.model) ?? ''
  const model = make && modelsByMake[make]!.includes(requestedModel) ? requestedModel : ''

  const parseYear = (value: string | string[] | undefined) => {
    const year = Number(first(value))
    return years.includes(year) ? year : null
  }
  let yearFrom = parseYear(params.yearFrom)
  let yearTo = parseYear(params.yearTo)
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]

  const cars = allCars.filter(
    (car) =>
      (!make || car.make === make) &&
      (!model || car.model === model) &&
      (yearFrom === null || car.year >= yearFrom) &&
      (yearTo === null || car.year <= yearTo)
  )

  return { filters: { make, model, yearFrom, yearTo }, options: { makes, modelsByMake, years }, cars }
}

export function countActiveFilters({ make, model, yearFrom, yearTo }: CarFilters) {
  return [make, model, yearFrom, yearTo].filter((value) => value !== '' && value !== null).length
}
