import { AlertCircle, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// iOS-style grouped rows for the add and edit forms: a caption above a
// rounded surface, then 52px rows with the label on the left and a native
// control on the right. Rows are direct children of the group, so the inset
// hairline between them is one first:/border rule.

export const rowControlClass =
  'min-h-0 w-full min-w-0 appearance-none bg-transparent text-right font-body text-ink outline-none placeholder:text-text-muted'

export const rowSelectClass = cn(rowControlClass, 'pr-6 text-text-muted [text-align-last:right]')

export const rowClass =
  'ml-4 flex min-h-[52px] items-center gap-3 border-t border-hairline pr-4 first:border-t-0 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ink'

interface RowGroupProps {
  title: string
  locked?: boolean
  footer?: string
  children: React.ReactNode
}

export function RowGroup({ title, locked = false, footer, children }: RowGroupProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 px-1 font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {locked && <Lock size={13} strokeWidth={2} aria-hidden="true" />}
        {title}
      </h2>
      <div className="rounded-2xl bg-surface">{children}</div>
      {footer && <p className="px-1 font-body text-[13px] leading-snug text-text-muted">{footer}</p>}
    </section>
  )
}

// A label-left, control-right row. The <label> wraps the control, so tapping
// anywhere on the row focuses it.
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={rowClass}>
      <span className="w-[118px] shrink-0 font-body text-base text-ink">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end">{children}</span>
    </label>
  )
}

// A select row with a chevron, the native picker opening on tap.
export function SelectRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row label={label}>
      <span className="relative flex w-full items-center">
        {children}
        <ChevronRight
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
          className="pointer-events-none absolute right-0 text-ink-3"
        />
      </span>
    </Row>
  )
}

// A full-width row for long text: the label above, the field below.
export function StackedRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={cn(rowClass, 'flex-col items-stretch gap-1 py-3')}>
      <span className="font-body text-base text-ink">{label}</span>
      {children}
    </label>
  )
}

export const stackedControlClass =
  'w-full min-w-0 resize-y bg-transparent font-body text-ink outline-none placeholder:text-text-muted'

// Errors sit on the page background, not a card: signal red keeps 4.5:1 on
// both themes' background but not on the dark-mode card surface.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 px-1 font-body text-[15px] font-semibold text-signal-red">
      <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      {message}
    </p>
  )
}

// The floating glass bar that holds a form's submit buttons.
export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-4 bottom-[calc(26px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-2xl gap-2 rounded-[34px] p-1.5 glass md:inset-x-8">
      {children}
    </div>
  )
}

export const primaryButtonClass =
  'h-[52px] flex-[1.4] rounded-[26px] bg-ink font-body text-base font-bold text-ink-inverse transition-transform active:scale-[0.97] disabled:opacity-60'
export const secondaryButtonClass =
  'h-[52px] flex-1 rounded-[26px] bg-fill font-body text-base font-semibold text-ink transition-transform active:scale-[0.97] disabled:opacity-60'

// Room for the bottom bar (52px button + 12px padding + 26px lift) and a gap.
export const bottomBarSpace = 'pb-[calc(116px+env(safe-area-inset-bottom))]'
