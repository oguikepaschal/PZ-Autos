# Design Authority

PZ Autos design tokens are the source of truth and override any default from an installed design or Impeccable skill:

- Typefaces: Archivo and Barlow
- Primary color: `#141414`
- Signal red: `#D0121B`, capped at 5% of visual weight
- Base color: white

Where two installed skills disagree with each other (not with these tokens), stop and ask before choosing one.

## Animation timing

- All UI animation stays at or under 300ms.
- Exception: 500–800ms is allowed only for a rare focal entrance on a marketing surface, such as a listing page hero. It is never allowed on repeated interactions: hover, press, toggles, modals, menus, lists, or navigation.
- A single easing curve applies everywhere: `cubic-bezier(0.23, 1, 0.32, 1)`.
- This rule overrides any skill's timing guidance, including `impeccable/reference/animate.md`.
