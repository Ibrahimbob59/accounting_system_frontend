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
`src/styles/tokens.css` is organized into four tiers, top to bottom, by how
often each one is expected to change:
- **Theme** (`--primary-*`, `--secondary-*`, `--tertiary-*`) — the only
  tokens a white-label client's re-skin touches, and each scale has exactly
  ONE literal hex value: the `-900` seed. Every other step in that scale
  (`-700`/`-500`/`-300`/`-200`/`-100`) is
  `color-mix(in oklch, var(--X-900) N%, white)` — the same ramp
  (88%/55%/30%/18%/10%) reused across all three scales — not its own
  hand-picked hex. A full re-skin is genuinely "pick one hex per color
  group," not six: change `--primary-900` and `--secondary-900` and every
  derived shade follows (verified by swapping both to unrelated hues and
  confirming the sidebar, links, gradient, buttons, icons, and ledger-rule
  accent all re-tint together — nothing stayed on the old hue). The `88%`
  step is deliberately not the "nicest-looking" even ramp — `--secondary-700`
  is a button background and must clear 4.5:1 contrast against
  `--text-on-primary`; 80% only measured 4.05:1 (a real accessibility
  regression, caught by measuring, not by eye), 88% measures 4.83:1. If you
  change a seed to a very different lightness/hue, re-measure that pairing
  rather than assuming the percentage still holds.
- **Structural** (fonts, radius, shadows) and **Semantic**
  (success/warning/danger/info) — both rarely change, and are independent
  of the theme tier above (swapping a client's secondary/brass accent
  doesn't touch their "danger" red).
- **Neutral surface scale** — `--neutral-0` through `--neutral-950`, and
  critically: every step *except* `--neutral-0` (pure white) is a
  `color-mix(in oklch, var(--primary-900) N%, white)` (or `black`, at the
  darkest end) — not its own hardcoded hex. Every background/surface/text/
  border token is then an alias onto one of these steps (e.g.
  `--text-primary: var(--neutral-900)`). Two layers of indirection, two
  payoffs:
  1. **A theme swap only ever touches primary/secondary/tertiary.** Change
     `--primary-900` and the entire neutral ramp — every background,
     surface, text color, and border in the app — re-tints to match
     automatically, because they're mathematically derived from it, not
     independently chosen to merely *look* coordinated. (Verified by
     swapping `--primary-900` alone to an unrelated hue and confirming
     `--background`/`--text-primary`/`--border`/`--sidebar` all update; the
     brass secondary/action color is correctly unaffected.)
  2. Light/dark mode is cheap: the `:root[data-theme='dark']` block at the
     bottom of the file remaps only these aliases to a different point on
     the same derived scale — `--background` moves from `--neutral-100` to
     `--neutral-950`, etc. — and it inherits the re-tinting for free.
  - Mixed `in oklch`, not plain `srgb`: oklch interpolates lightness
    perceptually, so the ten intermediate steps read as evenly spaced.
    Plain sRGB channel mixing compresses badly at the light end (the first
    few percent of mix barely move the lightness), which is the kind of
    subtle bug you'd only catch by actually measuring computed colors.
  - Shadows (`--shadow-xs`...`--shadow-xl`) are derived the same way —
    `color-mix(in srgb, var(--primary-900) N%, transparent)` — so they
    re-tint with the theme too, instead of an independently hand-picked
    rgba that happened to look close to ink.
- When adding a new UI-chrome color (a new background/border/text shade),
  add it as an alias onto an existing (or new) neutral step — and if that
  step doesn't exist yet, add it as another `color-mix()` percentage
  against `--primary-900`, not a bespoke hex. If it should darken in dark
  mode, add the override in the `[data-theme='dark']` block. Never add a
  hardcoded hex outside this derivation for something that's conceptually a
  background/surface/text/border color.
- Semantic colors (success/warning/danger/info) are the deliberate
  exception to "derive everything from theme" — they stay fixed,
  brand-independent colors. Tying "danger" to a client's primary/secondary
  risks a client whose brand happens to be red or green producing a status
  color that reads as the wrong thing, or nothing at all.
- The `--primary`/`--secondary`/`--accent`/etc. tokens shadcn/ui expects
  (unnumbered, e.g. `bg-primary`) are a *different* namespace from our
  numbered brand scale (`--primary-900`, `bg-primary-900`) — the former is
  shadcn's own vendor semantic (currently pointed at our secondary/brass
  scale, since brass is the action color), the latter is our brand token.
  `bg-secondary` (shadcn's neutral "secondary button" style) and
  `bg-secondary-700` (our brass brand color) are unrelated for the same
  reason — always check whether a class has a number suffix before assuming
  what it maps to.
- **No theme-switcher UI exists yet.** The tokens are dark-mode-ready
  (verified by setting `data-theme="dark"` on `<html>` directly), but no
  toggle component/store reads or writes that attribute — that's a separate
  feature, not implied by the token structure existing.
- **Known gap:** brand colors (`--primary-700` used for link text, etc.)
  are deliberately left unchanged between themes, per the tiering above —
  but at least one of them (`--primary-700` text on the dark
  `--neutral-950` background) measures under WCAG AA contrast (~2.3:1
  against a 4.5:1 minimum). Revisit if dark mode ships for real — likely
  fix is a dark-mode-only *link* color exception, not changing the brand
  scale itself.

### Sizing units
- Every size in this app — spacing, type, radius, arbitrary Tailwind values —
  is in `rem`, never a raw `px`. Tailwind's own default scale (`p-4`,
  `text-lg`, `h-10`, ...) is already rem-based, so this falls out for free
  in most components; it only needs attention in hand-authored CSS
  (`tokens.css`, `globals.css`) and arbitrary bracket values
  (`max-w-[25rem]`, not `max-w-[400px]`).
- `html { font-size }` steps up at `sm` (640px) and `lg` (1024px) in
  `globals.css` — 16px → 17px → 18px — so every rem value in the app scales
  proportionally at wider breakpoints from one place, instead of
  re-tuning spacing/type per component per breakpoint. Match any new
  breakpoint-dependent root change to Tailwind's own breakpoints so it never
  drifts out of sync with `sm:`/`lg:` utilities elsewhere.
- Exception, by design: physical/depth effects — `border-width`, shadow
  blur/offset, hairline rule thickness — stay in `px`. These represent a
  fixed visual thickness on the screen, not a text-relative size, and
  shouldn't grow just because the root font-size stepped up. Radius,
  by contrast, is in `rem` — it's a component size that should scale with
  everything else.
- Use `%` (not a fixed `px`) for the root `html` rule itself, so it composes
  with the user's browser zoom / OS text-size accessibility setting instead
  of overriding it.

### Style scoping — avoiding cascade conflicts
Tailwind's atomic utility classes rarely collide with each other. The risk
is hand-authored CSS: two components each writing a `.card` class, or a
combinator selector like `.section .cta` silently out-specificity-ing a
utility class applied alongside it. This project avoids that with two
rules:
- **Prefer Tailwind utilities composed via `cn()` over hand-written CSS.**
  Only write actual CSS when a utility genuinely can't express it (e.g. the
  `::after`-based double-rule in `.ledger-rule`).
- **When you do write CSS, scope it — don't add unscoped global classes.**
  - A motif meant to be shared and reused by class name across features
    (`.ledger-rule`, `.field-line`/`.field-label` for form fields,
    `.ledger-texture` for the auth brand panel) is the rare, deliberate
    exception: it lives in `globals.css`, inside `@layer components`
    (Tailwind v4's own cascade layer, declared by `@import 'tailwindcss'`).
    Any Tailwind utility class is in the later `utilities` layer, so it
    always wins a specificity tie against a `components`-layer class —
    composing `cn('ledger-rule', 'text-lg')` behaves exactly as it reads,
    with no "which one wins" ambiguity to reason about.
  - Everything else — CSS that's specific to one component, not a shared
    system motif — goes in a co-located CSS Module:
    `ComponentName.module.css` next to `ComponentName.tsx`, imported as
    `import styles from './ComponentName.module.css'`. Vite/TypeScript
    support this natively (no config needed — see `vite-env.d.ts`'s
    `vite/client` reference); the build hashes every class name, so two
    components can both have a `.row` class and never collide.
  - Inside any hand-written CSS (global or a module), selectors stay flat —
    one class per rule, plus pseudo-classes/pseudo-elements on that same
    class. Never a combinator (`.section .cta`, `.card > h3`) — that's
    exactly the pattern that silently out-specificities a sibling utility
    class. Express conditional styling by composing Tailwind classes in JS
    via `cn()`, not by nesting CSS selectors.

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
- No inline hex colors, arbitrary shadows, or pixel values — use tokens.
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
