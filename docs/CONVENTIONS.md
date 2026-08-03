# Conventions

These conventions are mandatory. Every file in this project must follow
them without exception. When in doubt, follow the convention — do not invent.

## File naming
- Non-component TypeScript files: kebab-case ->
  `auth-store.ts`, `api-client.ts`, `complete-auth.ts`
- Component files: PascalCase -> `TextField.tsx`, `LoginPage.tsx`
- Hooks: `useX.ts`, one hook per file -> `useLogin.ts`, `useAuthBootstrap.ts`
- Per-feature API layer: `{feature}.api.ts` -> `auth.api.ts`, `leads.api.ts`
- Per-feature types: `{feature}.types.ts` -> `auth.types.ts`, `leads.types.ts`
- Pages: `{Name}Page.tsx`, one route = one page component
- Zustand stores: `{name}-store.ts` -> `auth-store.ts`
- Locale files: `src/i18n/locales/{lang}/{namespace}.json`, one namespace
  per feature, mirrored across all three languages

## Feature module structure
Every feature under `src/features/` uses only the subfolders it needs, from
this fixed set — never invent a new one:

```
features/{feature}/
  api/          <- {feature}.api.ts — thin wrappers over `http`
  components/   <- feature-local components (not shared cross-feature)
  hooks/        <- one useX per query/mutation
  lib/          <- feature-local non-component logic (e.g. complete-auth.ts)
  pages/        <- route-level components
  store/        <- Zustand store, only if the feature owns global state
  types/        <- request/response types + Zod schema factories
```

## Component conventions
- `components/ui/` holds shadcn-generated primitives. Treat this folder as
  vendor code: regenerate via the shadcn CLI rather than hand-editing
  conventions into it, and don't fight its co-export pattern (e.g.
  `buttonVariants` exported alongside `Button` — this is why
  `react-refresh/only-export-components` is disabled for this folder in
  `eslint.config.js`).
- `components/common/` holds hand-written primitives shared across
  features (`TextField`, `PasswordField`, `SelectField`, `TextareaField`,
  `FormBanner`, `LanguageSwitcher`). A component only belongs here once a
  second feature needs it — don't pre-emptively generalize a one-off.
- Every field-style common component (`TextField`, `PasswordField`,
  `SelectField`, `TextareaField`, `CheckboxField`, `RadioGroupField`,
  `SwitchField`) follows the same shape: `id`/`name` + `label` + optional
  `error`, a real `<Label htmlFor={...}>`, `aria-invalid` when an error is
  present, and `aria-describedby` pointing at a `{id}-error` paragraph.
  Match this shape for any new field component instead of inventing a
  different error-display pattern.
  - **`TextField`/`PasswordField`/`SelectField`/`TextareaField` integrate
    with react-hook-form via `{...register('name')}`** — they're native
    form elements, so register's ref+onChange shape works directly.
  - **`CheckboxField`/`RadioGroupField`/`SwitchField` do NOT** — Radix's
    Checkbox/RadioGroup/Switch are buttons under the hood (role="checkbox"
    /"radio", not `<input>`), so integrate them via `Controller` instead:
    `<Controller name="x" control={control} render={({field}) => <CheckboxField checked={field.value} onCheckedChange={field.onChange} .../>} />`.
- `Modal` (wraps shadcn's Dialog) is the one place modal-wide layout lives
  — title/description/footer slots, title in the display font. Compose a
  `Modal` rather than reaching for `Dialog`/`DialogContent`/etc. directly.
- `DataTable` (wraps TanStack Table + shadcn's Table) comes with sorting
  built in; add pagination/filtering per-screen via TanStack's
  `getPaginationRowModel`/`getFilteredRowModel` only once a real list needs
  them. **Sort operates on the raw accessor value** — a money/date column
  must keep the raw number/Date in the row data and format only inside
  `cell`, or it sorts as a string ("$1,200.00" < "$450.00" lexicographically,
  which is wrong for money).
- `StatusBadge` (success/warning/danger/info/neutral) is for domain status
  chips (invoice status, roles, ...) and is intentionally separate from
  shadcn's own `Badge` (`components/ui/badge.tsx`) rather than added to its
  cva config — keeps that file a clean, regeneratable shadcn primitive.
- `src/lib/swal.ts` wraps SweetAlert2 for confirm dialogs/alerts/toasts
  (`confirm()`, `alert()`, `toast()`) — chosen over building a themed
  equivalent from scratch, at the cost of shallower theme integration than
  every other component here (see ARCHITECTURE.md → Shared component
  library). Import from `@/lib/swal`, never call the `sweetalert2` package
  directly from a feature — same "one seam" reasoning as the axios client.
- Feature components accept props, not global reads, wherever practical;
  read from a store only where the feature genuinely needs session-wide
  state (e.g. guards reading `auth-store`).

## Form conventions
- react-hook-form + `zodResolver`. The Zod schema is built by a
  `makeXSchema(t: TFunction<'namespace'>)` factory — never a static
  module-level schema — so validation messages are localized. Call it via
  `useMemo(() => makeXSchema(t), [t])` so it doesn't rebuild every render.
- `mode: 'onChange'` for short forms where instant feedback matters (login,
  reset password); `onTouched` for longer forms where per-keystroke
  validation would be noisy (demo request). Pick based on that tradeoff, not
  arbitrarily.
- Optional string fields: accept `''` from the input
  (`z.string().optional().or(z.literal(''))`), then coerce empty ->
  `undefined` in the submit handler before building the request body. Zod
  schemas never emit `''` into the API payload.
- Submit handlers build a typed request object explicitly (don't spread
  raw form values into the API call) so the request shape is visibly
  decoupled from the form shape.
- `noValidate` on every `<form>` — validation is Zod's job, not the
  browser's.

## API layer conventions
- Only `src/lib/api-client.ts` imports `axios` directly. Every other file
  calls the exported `http.get/post/put/patch/delete` helpers — never
  `apiClient` or a bare `axios` call from feature code (the one exception is
  the refresh call inside `api-client.ts` itself, which deliberately bypasses
  the interceptor chain to avoid recursion).
- One `{feature}.api.ts` per feature, exporting a plain object of thin
  named functions — one function per endpoint, each just a typed `http.x()`
  call. No branching, no error handling, no business logic in this layer.
- One hook per endpoint in `hooks/`, wrapping `useQuery`/`useMutation` around
  exactly one `{feature}Api` function. Hooks don't reach into other
  features' APIs.
- The `http` helpers already return the unwrapped payload (`T`, not
  `{data: T}}`) — never write `.data.data` in calling code.

## Error handling conventions
- The response interceptor throws `ApiException(code, message, field)` for
  any backend error envelope. Feature code catches this via
  `onError` on the mutation/query and branches on `err.code` for
  known, actionable cases (e.g. `AUTH_INVALID_CREDENTIALS`,
  `AUTH_INVALID_RESET_CODE`, `AUTH_TOO_MANY_ATTEMPTS`), falling back to a
  generic translated message for everything else.
- Never render `err.message` (the raw backend string) directly to the user
  — always go through a translated string keyed off `err.code`, so all
  user-facing copy stays localizable and independent of backend wording.
- Field-level errors use `setError('field', { message })` on the form;
  everything else surfaces via `FormBanner`.

## i18n conventions
- No hardcoded user-facing strings, anywhere — always `t('key')`.
- Adding a feature means: create `{lang}/{feature}.json` for all three
  languages, then register the namespace in both the `ns` array and the
  `resources` map in `src/i18n/index.ts`.
- Keep translation keys structured by screen/section
  (`login.email`, `login.errors.invalidCredentials`), not flat.

## Styling conventions
- Reference design tokens / Tailwind utilities only — never hardcode a hex
  color, arbitrary shadow, or pixel radius in a component. If a needed value
  doesn't exist as a token, add it to `src/styles/tokens.css`, don't inline it.
- Use logical CSS properties/utilities (`ps-`, `pe-`, `text-start`,
  `text-end`, `end-0`/`start-0`) instead of physical `left-`/`right-`/`ml-`/
  `mr-`, since `ar` is a supported RTL locale and the layout must mirror
  automatically.

### Theming and dark mode
`src/styles/tokens.css` is the single source of truth for the Flowstack
design system, and it is organized by **four independent axes**. The whole
point of the split is that changing one axis never requires touching
another:

1. **Brand** — `--brand`, `--brand-hover`, `--brand-soft`. Exactly one
   accent color in the product (emerald `#10B981`). `--brand-soft` is a
   `color-mix()` of `--brand`, not a hand-picked tint, so a rebrand is a
   one-line change and the soft fills follow automatically. The numbered
   `--secondary-*` scale is kept as an alias onto these for components that
   address the accent by step.
   - **No gradients, anywhere.** Every fill in the UI is a flat color. A
     `bg-gradient-*` utility in this codebase is a bug.
   - **One accent, total.** Status colors are semantic, not decorative —
     don't reach for `--info` because you want a second blue.
2. **Neutrals** — `--page-bg`, `--surface-bg`, `--border-color`,
   `--row-border`, `--table-head-bg`, and the text ramp. Components never
   read these directly; they read the aliases (`--background`, `--surface`,
   `--text-primary`, `--border`, ...). **This is the only axis light/dark
   swaps**, which is what makes `:root[data-theme='dark']` a short remap
   rather than a second copy of the system.
3. **Semantic** — danger/warning/info/neutral-badge, each paired with a
   `-soft` fill token. Deliberately **identical in both themes**: a "danger"
   red that shifted with the theme would stop reading as danger. Note these
   are real paired tokens, *not* an opacity of the text color — a `/10` fill
   over a dark surface all but vanishes, which is the bug the pairing avoids.
4. **Feel** — density (`spacious`|`compact`) and corners (`rounded`|`sharp`),
   toggled by `data-density`/`data-corners` on `<html>` (see
   `src/app/shell/feel.ts`). Both are pure token remaps: page/card padding,
   grid gap, top-bar height, sidebar width, field padding, h1 and stat sizes,
   and the radius scale. **No component knows which mode is active** — adding
   a spacing or radius difference between modes is an edit to `tokens.css`
   alone. Express page padding as `p-page`, card padding as `p-card`, grid
   gaps as `gap-grid`; a hardcoded `p-6` on a card silently opts out of
   compact mode.

Two things sit deliberately *outside* the light/dark swap:
- **The sidebar** (`--sidebar`, `--sidebar-border`, `--sidebar-text`,
  `--sidebar-text-muted`) is dark in both themes — an intentional fixed
  "chrome" treatment. It is absent from the dark block on purpose; don't
  "fix" that by aliasing it onto a neutral.
- **Badge radius.** Badges are always `999px`; the `sharp` corner mode
  deliberately does not override `--radius-pill`.

Other rules:
- The `--primary`/`--secondary`/`--accent` tokens shadcn/ui expects
  (unnumbered, e.g. `bg-primary`) are a *different* namespace from our own.
  Notably **shadcn's `--accent` is its hover/highlight fill, not our brand
  accent** — ours is `--brand`/`bg-brand`. Always check for a number suffix
  or the `brand` name before assuming what a class maps to.
- When adding a new UI-chrome color, add it as an alias in the neutral
  section and add its dark-mode counterpart in the `[data-theme='dark']`
  block. Never inline a hex in a component.
- The theme toggle is real and ships (`app/shell/ThemeToggle.tsx`). The feel
  toggles have no UI yet by design — `feel.ts` exists so the choice is
  settable and persisted without a rework.

### Sizing units
- **The root stays at a flat 16px** (`html { font-size: 100% }`). The design
  handoff specifies its entire type and spacing scale in exact pixels, so
  Tailwind's rem scale maps 1:1 onto those numbers (`text-sm` = 14px, as
  specified). Density is handled by the token toggle above rather than by
  scaling the root — that keeps "compact" a designed step rather than a
  uniform shrink of everything. Still expressed as `%` so it composes with
  browser zoom / OS text-size settings instead of overriding them.
- Tailwind's own scale (`p-4`, `text-lg`, ...) is rem-based and is the
  default choice. Reach for an exact px bracket value
  (`text-[15px]`, `size-[34px]`) only where the handoff names an exact pixel
  size that has no scale step — and prefer a density/radius token over a
  bracket value whenever one exists.
- Radius tokens are in `px`, not rem: the handoff specifies exact pixel
  corners, and a corner is a fixed physical detail. Same reasoning as
  `border-width` and shadow blur/offset, which also stay in px.

### Style scoping — avoiding cascade conflicts
Tailwind's atomic utility classes rarely collide with each other. The risk
is hand-authored CSS: two components each writing a `.card` class, or a
combinator selector like `.section .cta` silently out-specificity-ing a
utility class applied alongside it. This project avoids that with two
rules:
- **Prefer Tailwind utilities composed via `cn()` over hand-written CSS.**
  Only write actual CSS when a utility genuinely can't express it, or when a
  visual must be defined in exactly one place.
- **When you do write CSS, scope it — don't add unscoped global classes.**
  - A motif meant to be shared and reused by class name across features is
    the rare, deliberate exception: it lives in `globals.css`, inside
    `@layer components`. The current set is `.field-box` (the bordered form
    field, which owns the border/radius/focus ring so the `<input>` inside
    stays bare), `.field-label`, `.section-label` (form group headings),
    `.table-label` (column headers) and `.icon-chip`. Any Tailwind utility
    is in the later `utilities` layer, so it always wins a specificity tie
    against a `components`-layer class — composing
    `cn('icon-chip', 'size-10')` behaves exactly as it reads.
  - Everything else — CSS specific to one component, not a shared system
    motif — goes in a co-located CSS Module: `ComponentName.module.css`
    next to `ComponentName.tsx`. Vite/TypeScript support this natively; the
    build hashes every class name, so two components can both have a `.row`
    class and never collide.
  - Inside any hand-written CSS, selectors stay flat — one class per rule,
    plus pseudo-classes/pseudo-elements on that same class. Never a
    combinator (`.section .cta`, `.card > h3`) — exactly the pattern that
    silently out-specificities a sibling utility class. Express conditional
    styling by composing Tailwind classes in JS via `cn()`, not by nesting.
- Keyboard focus is defined **once**, as a base-layer `:focus-visible` rule
  in `globals.css`, rather than per-component. Don't add
  `focus-visible:ring-*` utilities to new interactive elements — they're
  already covered, and a per-component ring will fight the global one.

### Where CSS lives — the five tiers
This project's styling maps onto the same five-tier separation used in this
team's other, larger SCSS-based projects
(`abstracts`/`vendors`/`components`/`layout`/`pages`), just adapted to
Tailwind + CSS Modules instead of Sass partials + `@forward` barrels:

| Tier | SCSS-project equivalent | This project |
|---|---|---|
| Abstracts (tokens) | `abstracts/_variables.scss` | `src/styles/tokens.css` |
| Vendors (3rd-party bridge) | `vendors/_bootstarp.scss`, `_coreui.scss` | `src/styles/vendors.css` |
| Components (shared, cross-feature) | `components/_buttons.scss`, `_tables.scss` | co-located `Component.module.css` in `src/components/common/` — none needed yet, convention only |
| Layout (app chrome) | `layout/_sidebar.scss`, `_toolbar.scss` | co-located module in `src/app/` once a real app shell exists (Phase 2) — none yet |
| Pages/features | `pages/{feature}/{sub-feature}/_*.scss` | co-located `Component.module.css` per feature component in `src/features/{feature}/components/` |

Two behavioral rules carry over directly from that pattern:
- **Split by concern, not by size.** The SCSS project's best-organized
  folders (`pages/catalog/product-form/`) split one complex page into ~13
  single-concern partials (`_header`, `_body`, `_fields`, `_footer`,
  `_animations`, ...) aggregated by one entry file — versus its worst
  folders, where an entire page's CSS sits in one multi-thousand-line file
  with banner comments faking sub-sections. The equivalent mistake here
  would be one sprawling `.module.css` per feature instead of one per
  component. When a feature component's own custom CSS grows past a
  handful of rules, split it into sibling components (each with its own
  small `.module.css`) rather than growing one file — the same discipline
  as `pages/catalog/product-form/`, just via component decomposition
  instead of Sass `@use` chains.
- **Never reach into a sibling's internals.** The SCSS project's `_all.scss`
  barrels mean a parent only ever imports one name per folder, never a
  sibling's individual partials directly. The equivalent rule already
  exists here (ARCHITECTURE.md → Feature module rules): a feature never
  imports another feature's `components/`/`hooks/`/`store/`/`lib/`
  directly — anything genuinely shared belongs in `components/common` or
  `src/lib` instead.

## State conventions
- Server data: TanStack Query only, via a feature's `hooks/`. Never
  `useEffect` + `useState` to fetch.
- Global client state: the relevant feature's Zustand store — there is
  exactly one today (`auth-store`). Don't create a second global store for
  something that can live in a feature's local state or TanStack Query cache.
- Form fields: react-hook-form's `register`/`control`, never mirrored into
  component `useState`.

## Forbidden patterns
- No calling `axios`/`apiClient` directly outside `src/lib/api-client.ts`.
- No hardcoded user-facing strings — must go through i18n.
- No inline hex colors or arbitrary shadows — use tokens. Exact px bracket
  values are allowed only where the design handoff names a size with no
  scale step; a density or radius token always wins if one exists.
- No gradients (`bg-gradient-*`, `linear-gradient`) anywhere in the UI —
  every fill in this design system is a flat color.
- No hardcoded page/card padding (`p-6` on a page wrapper or card) — use
  `p-page`/`p-card`/`gap-grid`, or compact density silently won't apply.
- No physical-direction spacing/positioning utilities (`left-`, `right-`,
  `ml-`, `mr-`) — use logical properties for RTL correctness.
- No cross-feature imports of another feature's `components/`, `hooks/`,
  `lib/`, or `pages/` — only its `store/` (if it exposes one) is a
  sanctioned cross-feature touchpoint; anything else shared belongs in
  `components/common` or `src/lib`.
- No rendering raw `err.message` from a caught `ApiException` — always
  translate by `err.code`.
- No `any` — this project runs TypeScript strict; narrow `unknown` instead.
- No raw `<table>` markup for tabular data — use `DataTable`
  (`components/common/DataTable.tsx`), even for a simple read-only list.
- No reaching for shadcn's `Dialog`/`DialogContent`/etc. directly — compose
  `Modal` (`components/common/Modal.tsx`) instead, so modal-wide layout
  stays in one place.
- No bare shadcn `Checkbox`/`RadioGroup`/`Switch` (or a native
  `<input type="checkbox">`/`type="radio">`) in a form — use
  `CheckboxField`/`RadioGroupField`/`SwitchField`
  (`components/common/`), same a11y-wiring reasoning as
  TextField/SelectField.
- No ad-hoc status color chips (`<span className="bg-green-100 ...">`) —
  use `StatusBadge` (`components/common/StatusBadge.tsx`) with a
  success/warning/danger/info/neutral variant.
- No calling `sweetalert2` directly, and no `window.alert`/
  `window.confirm` — use `src/lib/swal.ts`'s `confirm()`/`alert()`/
  `toast()`, the same "one seam" reasoning as the axios client.
- No building a new shared UI primitive from scratch before checking
  `components/ui/` (shadcn's registry may already have it —
  `npx shadcn add <name>`) and `components/common/` (a themed wrapper may
  already exist) first.
