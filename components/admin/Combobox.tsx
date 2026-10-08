'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { rowControlClass } from './FormRows'

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
    <div ref={rootRef} className="relative w-full">
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
        className={rowControlClass}
      />
      {open && (filtered.length > 0 || emptyHint) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute right-0 top-full z-20 mt-2 max-h-56 w-[min(18rem,calc(100vw-3rem))] overflow-auto rounded-xl bg-surface text-left shadow-lg ring-1 ring-hairline"
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
              className={`flex min-h-11 items-center px-4 font-body text-base cursor-pointer ${
                index === highlighted ? 'bg-fill text-ink' : 'text-ink'
              }`}
            >
              {option}
            </li>
          ))}
          {filtered.length === 0 && emptyHint && (
            <li className="flex min-h-11 items-center px-4 font-body text-sm text-text-muted">{emptyHint}</li>
          )}
        </ul>
      )}
    </div>
  )
}
