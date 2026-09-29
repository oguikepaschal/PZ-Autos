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

## Git

Never add attribution to commit messages or PR descriptions. No Co-Authored-By trailer, no 'Generated with Claude Code' line, no Claude-Session trailer and no claude.ai session links. Commit messages and PR bodies contain only the description of the change.

Keep PR descriptions short: a simple description of what the PR is about. No test plan section, no code snippets.

- Every new table, view or function in `public` must include explicit grants in its migration, because default privileges grant nothing to anon or authenticated. New functions must also `revoke execute ... from public, anon`, since PUBLIC execute cannot be removed by default privileges.
- Any migration applied with `apply_migration` must be saved in the repo under the exact version live history records.
- After any migration, regenerate `lib/supabase/database.types.ts` from the live project with `generate_typescript_types` and commit it in the same PR.
