'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface ComboboxProps {
  name?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  emptyHint?: string
}

// Type-ahead combobox with a free-entry escape hatch: typing a value that
// isn't in `options` is always valid input, it's just not suggested. Used
// for Make/Model, where inventory is broker-sourced and not limited to a
// fixed brand list — a closed <select> would block entering a real car.
export function Combobox({ name, value, onChange, options, placeholder, emptyHint }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const filtered =
    value.trim() === ''
      ? options
      : options.filter((option) => option.toLowerCase().includes(value.trim().toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectOption(option: string) {
    onChange(option)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[highlighted]) {
        e.preventDefault()
        selectOption(filtered[highlighted]!)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setHighlighted(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full border border-hairline rounded-lg min-h-11 px-3 py-2 font-body text-body text-ink"
      />
      {open && (filtered.length > 0 || emptyHint) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto overscroll-contain rounded-lg border border-hairline bg-white shadow-lg"
        >
          {filtered.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={index === highlighted}
              onMouseDown={(e) => {
                e.preventDefault()
                selectOption(option)
              }}
              className={`min-h-11 px-3 py-2 font-body text-body cursor-pointer ${
                index === highlighted ? 'bg-surface text-ink' : 'text-ink'
              }`}
            >
              {option}
            </li>
          ))}
          {filtered.length === 0 && emptyHint && (
            <li className="px-3 py-3 font-body text-small text-text-muted">{emptyHint}</li>
          )}
        </ul>
      )}
    </div>
  )
}
