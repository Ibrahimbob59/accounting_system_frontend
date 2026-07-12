# Architecture

## System overview
This repo is the web back-office frontend for the accounting-system ERP
platform — a React single-page app consumed by admins, accountants, and
purchasing/invoicing staff. It talks exclusively to the accounting-system
backend (a separate NestJS repo) over its REST API. It is one of several
clients of that backend:
- This repo — React web back-office
- A Flutter POS terminal (offline-capable, syncs on reconnect)
- A Flutter mobile app (managers, warehouse staff)

This repo contains the web frontend only. The backend and other clients are
separate repos.

## Stack
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript — strict mode |
| Routing | React Router v7 (data router — `createBrowserRouter`) |
| Server state | TanStack Query v5 |
| Client/session state | Zustand v5 (+ `persist` middleware) |
| Forms | react-hook-form + Zod (`@hookform/resolvers`) |
| HTTP | axios |
| UI primitives | shadcn/ui ("new-york" style) + Radix UI |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Icons | lucide-react |
| i18n | i18next + react-i18next (en / fr / ar, with RTL) |
| Package manager | npm |

## Folder structure

```
src/
  app/
    providers/      <- composition root: QueryProvider, AppProviders
    router/          <- route tree (createBrowserRouter)
  components/
    ui/              <- shadcn-generated primitives (button, input, label, textarea, ...)
    common/           <- hand-written, cross-feature building blocks
                        (TextField, PasswordField, SelectField, TextareaField,
                        FormBanner, LanguageSwitcher)
  features/
    auth/            <- api/, components/, hooks/, lib/, pages/, store/, types/
    landing/          <- components/, pages/
    leads/            <- api/, components/, hooks/, types/
    (future: invoicing/, partners/, inventory/, gl/, reports/, ...
     one folder per business domain, mirroring the backend's module list)
  i18n/               <- i18next setup + locales/{en,fr,ar}/{namespace}.json
  lib/                <- api-client.ts, query-client.ts, utils.ts
  styles/             <- tokens.css (design tokens), vendors.css (shadcn
                        bridge), globals.css (Tailwind entry + base styles)
  types/              <- shared cross-feature types (API envelope, etc.)
docs/                 <- architecture, conventions, API contracts (this folder)
```

Not every feature needs every subfolder — `leads` has no `store/` because it
carries no client-side state; only add a subfolder when a feature actually
needs it.

## Feature module rules
- Each feature owns its domain exclusively, mirroring the backend's
  module-per-domain structure (see the backend's `docs/ARCHITECTURE.md`).
- A feature's `api/` layer is the only place that calls `http` (see below)
  for that domain.
- A feature must never import another feature's internals (components,
  hooks, store, lib) directly. Anything genuinely shared belongs in
  `components/common` or `src/lib`, not reached into from a sibling feature.
- Cross-feature session state (e.g. "is the user logged in") is exposed
  through a feature's `store/` (e.g. `auth-store`), which other
  features/guards may read — that's the one sanctioned cross-feature
  touchpoint, distinct from reaching into another feature's components/hooks.

## State layers
Three distinct kinds of state exist in this app, each with exactly one tool:
1. **Server state** — anything that lives on the backend (profile, future
   invoices/partners/reports data) goes through TanStack Query, one hook per
   endpoint (`useLogin`, `useSubmitDemoRequest`, ...). Never fetch with
   `useEffect` + `useState`.
2. **Global client state** — cross-cutting app state that isn't
   server-owned. Today this is exactly the auth session
   (`features/auth/store/auth-store.ts`): `accessToken` stays in-memory only
   (short-lived, ~15 min), `refreshToken` is the only persisted field
   (`persist` + `partialize`), so a page refresh survives without forcing
   re-login while the access token itself is never written to disk.
3. **Local/form state** — react-hook-form owns every form's field state;
   Zod validates via `zodResolver`. Never mirror form fields into
   component `useState`.

## Routing
`src/app/router/index.tsx` defines a `createBrowserRouter` tree split into
two guarded groups:
- **Public group** (`PublicOnlyGuard`) — landing, login, register,
  forgot-password. An already-authenticated visitor is redirected to `/app`.
- **Protected group** (`AuthGuard`) — everything under `/app`. An
  unauthenticated visitor is redirected to `/login`.

Both guards read `isBootstrapping`/`isAuthenticated` off `auth-store` and
render a loading state while the boot-time silent refresh
(`useAuthBootstrap`) is in flight, so neither guard flashes the wrong screen
on a hard refresh. `/app` is currently a placeholder — the real app shell and
business screens (invoicing, partners, GL, reports, ...) land there in a
later phase, one route subtree per backend module.

## Authentication flow
1. `POST /auth/login` or `POST /auth/register` returns a token pair only
   (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`) — no user object.
2. `completeAuth()` (`features/auth/lib/complete-auth.ts`) stores the
   tokens, then fetches the profile via `GET /auth/me` and navigates to
   `/app`. A failed profile fetch does not undo the session — it's a
   best-effort follow-up, not a precondition for being logged in.
3. On every request, an axios request interceptor
   (`src/lib/api-client.ts`) attaches `Authorization: Bearer <accessToken>`
   from the store.
4. On a `401`, a response interceptor performs exactly one silent
   `POST /auth/refresh` (deduped across concurrent requests via a shared
   in-flight promise) and retries the original request; a second failure, or
   a `401` from the refresh call itself, clears the session and redirects to
   `/login`.
5. On app boot, `useAuthBootstrap` runs the same silent-refresh + `getMe`
   sequence once, above the router, so a returning user with a valid
   `refreshToken` never sees the login screen.

## i18n architecture
- `i18next` + `react-i18next` + `i18next-browser-languagedetector`, detecting
  from `localStorage` first, then the browser's language.
- Three supported languages: `en`, `fr`, `ar`. `ar` is RTL — the active
  language's directionality is synced onto `<html dir>`/`<html lang>`
  whenever it changes (`src/i18n/index.ts`).
- One namespace per feature (`common`, `auth`, `landing`, `leads`, ...),
  each with a `{lang}/{namespace}.json` file, all statically imported and
  bundled (no lazy-loading of translation chunks yet).

## Styling architecture
- Tailwind v4, configured entirely in CSS via `@tailwindcss/vite` — there is
  no `tailwind.config.js`.
- `src/styles/tokens.css` is the single source of design tokens, in four
  clearly separated tiers (see CONVENTIONS.md → Theming and dark mode for
  the full rationale):
  1. **Theme** — `primary`/`secondary`/`tertiary`, the only colors a
     white-label client's re-skin ever touches.
  2. **Structural** — typography, radius, shadows. Rarely changes.
  3. **Semantic** — success/warning/danger/info. Independent of theme.
  4. **Neutral surface scale** — a standard grayscale (`neutral-0`…`-950`)
     that `background`/`surface`/`text-*`/`border*` alias onto. This is the
     only tier a light/dark toggle touches — see the `[data-theme="dark"]`
     block at the bottom of the file, which remaps those aliases to a
     different point on the same scale. Theme and semantic colors are
     deliberately left out of that block: brand identity and status
     meaning stay constant across both themes.
  `src/styles/globals.css` is the Tailwind entry point that maps those
  tokens into utility classes; it has no color values of its own.
- `src/styles/vendors.css` holds bridge code only — CSS variable names and
  Tailwind utility aliases that exist solely because shadcn/ui's generated
  components expect them (`--primary`, `--muted-foreground`, `bg-primary`,
  etc.), each pointed at one of our own tokens. Nothing in this file is our
  own design system; if shadcn/ui is ever swapped out, this file is the
  only casualty. This three-way split — tokens (abstracts) / vendor bridge
  / base styles+utility wiring — mirrors the same separation used in this
  team's other SCSS-based projects (e.g. `abstracts/` vs `vendors/` in
  WhatsappCommunicationSystem's `scss/`), adapted to a Tailwind + CSS
  Modules stack instead of Sass partials. See CONVENTIONS.md → Style
  scoping for how this maps to `components`/`layout`/`pages` too.
- shadcn/ui is configured via `components.json`: `new-york` style, `neutral`
  base color, CSS variables on, no class prefix. Primitives are generated
  into `components/ui/` and treated as vendor code (see CONVENTIONS.md).
- Every size in the app is `rem`, and the root `html { font-size }` steps up
  at `sm`/`lg` (`globals.css`) so the entire UI scales proportionally at
  wider breakpoints from one place — see CONVENTIONS.md → Sizing units.
- Hand-written CSS beyond Tailwind utilities is either a shared motif in
  `globals.css`'s `@layer components` (Tailwind v4's own cascade layer, so
  utilities always win a specificity tie) or a co-located
  `ComponentName.module.css` for anything component-specific — see
  CONVENTIONS.md → Style scoping.

## Multi-tenancy
Tenant scoping (`company_id`) is entirely a backend concern — see the
backend's `docs/ARCHITECTURE.md` and `docs/MODELS.md` for how
`PrismaService.forTenant()` enforces it server-side. The frontend never
sends or manages a `companyId` for its own requests; it only reads
`companyId` off `CurrentUser` (`null` for a platform admin/support account)
to decide what UI to show.

## Deployment
Not yet formalized in this repo — no CI/build pipeline is checked in here.
`npm run build` produces a static `dist/` bundle; deployment target and
process are TBD.
