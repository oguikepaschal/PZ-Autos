import type { CSSProperties } from 'react'
import { LAYERS, TRAILS, type Trail, type TrailLayer } from './speedmarkTrails'
import styles from './SpeedmarkHero.module.css'

type Mode = 'desktop' | 'mobile'

// Speedmark dash: length to height 6:1, end cap slanted about 20 degrees.
// Every trail in the piece is this same dash, stretched.
const RATIO = 6
const SLANT = 16 / 44
const MARK = { h: 44, gap: 28, tail: 584, top: 200, rows: [264, 200, 136] } as const

// Intro timeline, seconds. The release is capped at 800ms by the project's
// animation rules, so the dash fade-out starts 0.7s into it.
const ENTER = { lead: 0.44, stagger: 0.08 }
const RELEASE = { start: 1.6, stagger: 0.05, fadeAfter: 0.7 }
const ENTER_SHIFT = 600 // how far right of rest the dashes start (desktop)
const STRETCH = 0.8 // the dash enters at 1.8x its length and settles to 1x
const RELEASE_HEAD = 1100
const RELEASE_TAIL = 700

// The whole mark is drawn at 85% about its centre: at full size the slice crop
// on wide panels pushed red past the 5% budget (about 6% at 1920px).
const MARK_SCALE = 0.85
const MARK_CENTRE = {
  x: MARK.tail - MARK.rows[0] / 2,
  y: MARK.top + (3 * MARK.h + 2 * MARK.gap) / 2,
}

const GEOM = {
  desktop: {
    w: 800,
    h: 800,
    horizon: 496,
    layers: ['far', 'mid', 'near'] as TrailLayer[],
    lane: (y: number) => y,
    // Ambient clock offset so the panel is already populated after the intro.
    clock: 11,
  },
  mobile: {
    w: 480,
    h: 160,
    horizon: 99,
    layers: ['mid', 'near'] as TrailLayer[],
    lane: (y: number) => +(14 + ((y - 120) / 360) * 70).toFixed(1),
    // No intro on mobile: start with the first red trail already underway.
    clock: TRAILS.find((t) => t.layer === 'near' && t.red)!.start + 2.2,
  },
} as const

type Vars = CSSProperties & Record<`--${string}`, string>
const vars = (v: Record<`--${string}`, string>) => v as Vars

function Stop({ at, op, tone }: { at: number; op: number; tone: 'white' | 'red' | 'bg' | 'grey' }) {
  const cls = { white: styles.stopWhite, red: styles.stopRed, bg: styles.stopBg, grey: styles.stopGrey }[tone]
  return <stop offset={at} stopOpacity={op} className={cls} />
}

function TrailShape({ t, mode, uid }: { t: Trail; mode: Mode; uid: string }) {
  const g = GEOM[mode]
  const { height: h, cycle } = LAYERS[t.layer]
  const slant = +(h * SLANT).toFixed(2)
  const length = Math.round(h * RATIO * t.length)
  const u0 = (((g.clock - t.start) % cycle) + cycle) % cycle
  const opacity = t.red && mode === 'mobile' ? 1 : t.opacity
  const near = t.layer === 'near'
  return (
    <g transform={`translate(0 ${g.lane(t.y)})`}>
      <g
        className={`${styles.trail} ${styles[t.layer]}`}
        style={vars({ '--x1': `${-length}px`, '--op': String(opacity), '--dl': `${(-u0).toFixed(2)}s` })}
      >
        {near && (
          <rect
            x={slant}
            y={-h}
            width={length - slant}
            height={3 * h}
            fill={`url(#${uid}-${t.red ? 'hr' : 'hv'})`}
            opacity={0.5}
          />
        )}
        <path
          d={`M${slant} 0H${length}L${+(length - slant).toFixed(2)} ${h}H0Z`}
          fill={`url(#${uid}-${t.red ? 'gr' : 'gw'})`}
        />
      </g>
    </g>
  )
}

function Trails({ mode, uid, only }: { mode: Mode; uid: string; only?: TrailLayer }) {
  const g = GEOM[mode]
  return (
    <>
      {g.layers
        .filter((l) => !only || l === only)
        .map((layer) =>
          TRAILS.filter((t) => t.layer === layer).map((t) => (
            <TrailShape key={`${layer}-${t.start}`} t={t} mode={mode} uid={uid} />
          )),
        )}
    </>
  )
}

function Mark({ uid }: { uid: string }) {
  const { h, gap, tail, top } = MARK
  const s = h * SLANT
  return (
    <g>
      {MARK.rows.map((L, i) => {
        const y = top + i * (h + gap)
        const hx = tail - L
        const midW = L - 2 * s + 1
        const haloW = L - s
        const ed = ENTER.lead + ENTER.stagger * i
        const rd = RELEASE.start + RELEASE.stagger * i
        const dash = vars({
          '--ed': `${ed.toFixed(2)}s`,
          '--rd': `${rd.toFixed(2)}s`,
          '--fd': `${(rd + RELEASE.fadeAfter).toFixed(2)}s`,
          '--r0': `${-RELEASE_HEAD}px`,
          '--r1': `${-RELEASE_TAIL}px`,
        })
        const bar = (width: number, x: number) =>
          vars({
            '--e0': `${ENTER_SHIFT}px`,
            '--k0': String(+((width + STRETCH * L) / width).toFixed(4)),
            '--k1': String(+((width + (RELEASE_HEAD - RELEASE_TAIL)) / width).toFixed(4)),
            '--ox': `${x}px`,
          })
        return (
          <g key={i} transform={`translate(0 ${y})`}>
            <g className={styles.dashIn} style={dash}>
              <g className={styles.dashOut}>
                <g className={styles.enterBar} style={bar(haloW, hx + s)}>
                  <g className={styles.relBar}>
                    <rect
                      x={hx + s}
                      y={-h * 0.8}
                      width={haloW}
                      height={h * 2.6}
                      fill={`url(#${uid}-hr)`}
                      opacity={0.5}
                    />
                  </g>
                </g>
                <g className={styles.enterCap} style={vars({ '--e0': `${ENTER_SHIFT}px` })}>
                  <g className={styles.relHead}>
                    <path d={`M${hx} ${h}L${hx + s} 0V${h}Z`} className={styles.red} />
                  </g>
                </g>
                <g className={styles.enterBar} style={bar(midW, hx + s - 0.5)}>
                  <g className={styles.relBar}>
                    <rect x={hx + s - 0.5} y={0} width={midW} height={h} className={styles.red} />
                  </g>
                </g>
                <g className={styles.enterCap} style={vars({ '--e0': `${ENTER_SHIFT + STRETCH * L}px` })}>
                  <g className={styles.relTail}>
                    <path d={`M${tail - s} 0H${tail}L${tail - s} ${h}Z`} className={styles.red} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        )
      })}
    </g>
  )
}

// Three faint trails behind the resting mark. Shown only under reduced motion.
function StaticTrails({ uid }: { uid: string }) {
  const { h, gap, tail, top } = MARK
  const s = h * SLANT
  return (
    <g className={styles.stat}>
      {[300, 250, 200].map((L, i) => (
        <path
          key={L}
          d={`M${s} 0H${L}L${L - s} ${h}H0Z`}
          fill={`url(#${uid}-gw)`}
          opacity={0.13}
          transform={`translate(${tail - 40} ${top + i * (h + gap)})`}
        />
      ))}
    </g>
  )
}

// Decorative: all geometry is server-rendered and all motion is CSS (see the
// module). The client wrapper only pauses it offscreen and in a hidden tab.
export function SpeedmarkHero({ mode }: { mode: Mode }) {
  const g = GEOM[mode]
  const { w, h, horizon } = g
  const desktop = mode === 'desktop'
  const uid = `pz-${mode}`
  const id = (name: string) => `${uid}-${name}`
  const overlay = desktop
    ? { left: 0.42, right: 0.86, rightW: 0.14, top: 0.1, bottom: 0.86, bottomH: 0.14 }
    : { left: 0.14, right: 0.88, rightW: 0.12, top: 0.18, bottom: 0.74, bottomH: 0.26 }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={`${styles.svg} ${styles[mode]}`}
      style={vars({ '--x0': `${w}px` })}
    >
      <defs>
        <linearGradient id={id('gw')}>
          <Stop at={0} op={1} tone="white" />
          <Stop at={0.5} op={0.5} tone="white" />
          <Stop at={1} op={0} tone="white" />
        </linearGradient>
        <linearGradient id={id('gr')}>
          <Stop at={0} op={1} tone="red" />
          <Stop at={0.55} op={0.6} tone="red" />
          <Stop at={1} op={0} tone="red" />
        </linearGradient>
        <radialGradient id={id('hv')}>
          <Stop at={0} op={0.2} tone="white" />
          <Stop at={1} op={0} tone="white" />
        </radialGradient>
        <radialGradient id={id('hr')}>
          <Stop at={0} op={0.3} tone="red" />
          <Stop at={1} op={0} tone="red" />
        </radialGradient>
        <linearGradient id={id('hz')}>
          <Stop at={0} op={0} tone="white" />
          <Stop at={0.25} op={0.12} tone="white" />
          <Stop at={0.7} op={0.12} tone="white" />
          <Stop at={1} op={0} tone="white" />
        </linearGradient>
        <linearGradient id={id('gd')} x1="0" y1="0" x2="0" y2="1">
          <Stop at={0} op={0.03} tone="white" />
          <Stop at={1} op={0} tone="white" />
        </linearGradient>
        <linearGradient id={id('rm')} x1="0" y1="0" x2="0" y2="1">
          <Stop at={0} op={1} tone="white" />
          <Stop at={1} op={1} tone="grey" />
        </linearGradient>
        <linearGradient id={id('lf')}>
          <Stop at={0} op={1} tone="bg" />
          <Stop at={0.4} op={0.6} tone="bg" />
          <Stop at={1} op={0} tone="bg" />
        </linearGradient>
        <linearGradient id={id('rf')}>
          <Stop at={0} op={0} tone="bg" />
          <Stop at={1} op={0.9} tone="bg" />
        </linearGradient>
        <linearGradient id={id('tp')} x1="0" y1="0" x2="0" y2="1">
          <Stop at={0} op={1} tone="bg" />
          <Stop at={1} op={0} tone="bg" />
        </linearGradient>
        <linearGradient id={id('bt')} x1="0" y1="0" x2="0" y2="1">
          <Stop at={0} op={0} tone="bg" />
          <Stop at={1} op={1} tone="bg" />
        </linearGradient>
        {desktop && (
          <radialGradient id={id('vg')} cx={0.5} cy={0.45} r={0.55}>
            <Stop at={0} op={0} tone="bg" />
            <Stop at={0.45} op={0} tone="bg" />
            <Stop at={1} op={1} tone="bg" />
          </radialGradient>
        )}
        <mask id={id('rk')} maskUnits="userSpaceOnUse" x={0} y={horizon} width={w} height={h - horizon}>
          <rect x={0} y={horizon} width={w} height={h - horizon} fill={`url(#${id('rm')})`} />
        </mask>
      </defs>

      <rect width={w} height={h} className={styles.bg} />

      <g className={styles.env}>
        <rect x={0} y={horizon} width={w} height={h - horizon} fill={`url(#${id('gd')})`} />
        <rect x={0} y={horizon} width={w} height={1} fill={`url(#${id('hz')})`} />
        {/* Wet asphalt: the near layer mirrored below the horizon at 30%. */}
        <g mask={`url(#${id('rk')})`}>
          <g opacity={0.3} transform={`translate(0 ${2 * horizon}) scale(1 -1)`} className={styles.refl}>
            <g className={styles.ambIn}>
              <Trails mode={mode} uid={uid} only="near" />
            </g>
          </g>
        </g>
      </g>

      <g className={`${styles.ambient} ${styles.ambIn}`}>
        <Trails mode={mode} uid={uid} />
      </g>

      {desktop && (
        <g
          transform={`translate(${MARK_CENTRE.x} ${MARK_CENTRE.y}) scale(${MARK_SCALE}) translate(${-MARK_CENTRE.x} ${-MARK_CENTRE.y})`}
        >
          <StaticTrails uid={uid} />
          <Mark uid={uid} />
        </g>
      )}

      {desktop && <rect width={w} height={h} fill={`url(#${id('vg')})`} />}
      <rect x={0} y={0} width={w * overlay.left} height={h} fill={`url(#${id('lf')})`} />
      <rect x={w * overlay.right} y={0} width={w * overlay.rightW} height={h} fill={`url(#${id('rf')})`} />
      <rect x={0} y={0} width={w} height={h * overlay.top} fill={`url(#${id('tp')})`} />
      <rect x={0} y={h * overlay.bottom} width={w} height={h * overlay.bottomH} fill={`url(#${id('bt')})`} />
    </svg>
  )
}
