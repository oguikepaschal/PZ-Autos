export type TrailLayer = 'far' | 'mid' | 'near'

export interface Trail {
  layer: TrailLayer
  /** Seconds into the layer's cycle at which this trail starts travelling. */
  start: number
  /** Lane (y) in the 800 x 800 desktop panel. */
  y: number
  /** Length as a multiple of the layer's dash length (height x 6). */
  length: number
  /** Peak opacity. White trails, or the signal red one when `red`. */
  opacity: number
  red: boolean
}

/**
 * height: dash height in panel units. pass: seconds to cross the panel.
 * cycle: seconds before the layer repeats; travel fills pass / cycle of it and
 * the rest is dark, which is what spaces the passes (and the red trail) out.
 */
export const LAYERS: Record<TrailLayer, { height: number; pass: number; cycle: number }> = {
  far: { height: 3, pass: 14, cycle: 28 },
  mid: { height: 6, pass: 9, cycle: 27 },
  near: { height: 12, pass: 6, cycle: 30 },
}

// Hand-tuned and fixed. Red is only ever on the near layer: two trails per
// 30s cycle, about one near pass in two or three.
export const TRAILS: readonly Trail[] = [
  { layer: 'far', start: 0, y: 452, length: 10, opacity: 0.09, red: false },
  { layer: 'far', start: 4.5, y: 404, length: 8, opacity: 0.11, red: false },
  { layer: 'far', start: 11.5, y: 470, length: 12, opacity: 0.08, red: false },
  { layer: 'far', start: 15, y: 372, length: 9, opacity: 0.1, red: false },
  { layer: 'far', start: 22, y: 436, length: 11, opacity: 0.12, red: false },

  { layer: 'mid', start: 0, y: 346, length: 8, opacity: 0.16, red: false },
  { layer: 'mid', start: 6.5, y: 446, length: 6, opacity: 0.19, red: false },
  { layer: 'mid', start: 12, y: 392, length: 10, opacity: 0.15, red: false },
  { layer: 'mid', start: 19, y: 304, length: 7, opacity: 0.2, red: false },

  { layer: 'near', start: 0, y: 292, length: 4, opacity: 0.34, red: false },
  { layer: 'near', start: 4.5, y: 430, length: 6, opacity: 0.85, red: true },
  { layer: 'near', start: 11, y: 352, length: 5, opacity: 0.34, red: false },
  { layer: 'near', start: 15.5, y: 470, length: 7, opacity: 0.85, red: true },
  { layer: 'near', start: 23, y: 210, length: 4, opacity: 0.34, red: false },
]
