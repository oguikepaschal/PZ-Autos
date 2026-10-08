'use client'

import { useEffect, useRef } from 'react'

interface ActionSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

// Shared row style for the buttons and links an ActionSheet holds.
export const sheetRowClass =
  'flex min-h-14 w-full items-center justify-center border-t border-hairline px-4 font-body text-[17px] text-ink first:border-t-0 active:bg-fill disabled:opacity-40'

const CLOSE_MS = 300

// A native modal <dialog>: it traps focus, returns focus to the opener, and
// turns Escape (and Android's back gesture, through the cancel event) into a
// close. The sheet rises from the bottom over a dimming scrim; the open state
// is a data attribute set a frame after showModal so the transition runs.
export function ActionSheet({ open, onClose, title, children }: ActionSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      const frame = requestAnimationFrame(() => dialog.setAttribute('data-open', ''))
      return () => cancelAnimationFrame(frame)
    }
    if (!open && dialog.open) {
      dialog.removeAttribute('data-open')
      const timer = window.setTimeout(() => dialog.close(), CLOSE_MS)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // The browser can close a modal without a cancelable cancel (Android
      // back with no recent user activation); keep the parent's state in step.
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="group fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-surface-dark/50 opacity-0 transition-opacity duration-300 group-data-[open]:opacity-100"
      />
      <div className="absolute inset-x-2 bottom-[calc(8px+env(safe-area-inset-bottom))] mx-auto max-w-md translate-y-[110%] transition-transform duration-300 group-data-[open]:translate-y-0 motion-reduce:translate-y-0 motion-reduce:opacity-0 motion-reduce:transition-opacity motion-reduce:group-data-[open]:opacity-100">
        <div className="overflow-hidden rounded-[22px] bg-surface">
          <p className="border-b border-hairline px-4 py-3 text-center font-body text-[13px] font-semibold text-text-muted">
            {title}
          </p>
          <div>{children}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-14 w-full rounded-[18px] bg-surface font-body text-[17px] font-semibold text-ink active:bg-fill"
        >
          Cancel
        </button>
      </div>
    </dialog>
  )
}
