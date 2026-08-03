# API Contracts

This documents how the frontend consumes the accounting-system backend API.
The backend is the source of truth for these shapes — see its
`docs/API-DESIGN.md` and `docs/MODELS.md` — this file documents the
frontend-side contract and integration points built on top of them.

## Base URL
Configured via `VITE_API_BASE_URL` (`.env`, see `.env.example`):
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
`src/lib/api-client.ts` reads this once at module load to construct the
shared axios instance. Never hardcode a base URL elsewhere.

## Envelope handling
The backend wraps every response in `{ data, meta }` (success) or
`{ data: null, error: {...} }` (error) — see backend `docs/API-DESIGN.md`.
The frontend never deals with this envelope directly:
- The axios **response interceptor** unwraps success responses to
  `response.data.data`, so every `http.get/post/...` call resolves directly
  to the payload type `T` — never write `.data.data` in calling code.
- On an error envelope, the interceptor throws a typed `ApiException`
  (`src/types/api.ts`): `{ code, message, field }`. Callers catch this via
  `onError` and branch on `.code` — see CONVENTIONS.md's error-handling
  section.
- `PaginationMeta` (`total`, `page`, `limit`, `totalPages`) is already typed
  in `src/types/api.ts` (`ApiSuccess<T>.meta`), ready for the first
  paginated list endpoint the frontend consumes.

## Auth token lifecycle
- `POST /auth/login` and `POST /auth/register` both return only
  `{ accessToken, refreshToken, tokenType, expiresIn }` — no user object.
  The frontend always follows either call with `GET /auth/me` to load the
  profile (see `features/auth/lib/complete-auth.ts`).
- `accessToken` is attached as `Authorization: Bearer <token>` by the
  request interceptor; it is kept in-memory only (Zustand, not persisted).
- `refreshToken` is the only field persisted to `localStorage`
  (`auth-store`'s `partialize`).
- On a `401`, the response interceptor calls `POST /auth/refresh` exactly
  once per request (deduped across concurrent 401s via a shared in-flight
  promise) and retries the original request with the new token. A second
  failure, or a `401` from the refresh call itself, clears the session and
  redirects to `/login`.
- `POST /auth/refresh` is called via a bare `axios.post` (not the shared
  `apiClient`) specifically to avoid re-entering this same interceptor
  chain.

## Endpoints currently consumed

### Auth (`features/auth/api/auth.api.ts`)
| Function | Method + path | Notes |
|---|---|---|
| `login` | `POST /auth/login` | Returns tokens only |
| `register` | `POST /auth/register` | `{ company, user }` body — see backend `docs/API-DESIGN.md` → Registration; returns tokens only |
| `getMe` | `GET /auth/me` | Fetched right after login/register/refresh |
| `forgotPassword` | `POST /auth/forgot-password` | Backend always returns a generic success regardless of whether the email exists |
| `resetPassword` | `POST /auth/reset-password` | `{ email, code, newPassword }`; known error codes: `AUTH_INVALID_RESET_CODE`, `AUTH_TOO_MANY_ATTEMPTS` |
| `logout` | `POST /auth/logout` | |

Known `ApiException.code` values branched on today:
`AUTH_INVALID_CREDENTIALS`, `AUTH_INVALID_RESET_CODE`,
`AUTH_TOO_MANY_ATTEMPTS`. Any other code falls back to a generic translated
error message — never assume a code not yet handled explicitly.

### Leads (`features/leads/api/leads.api.ts`)
| Function | Method + path | Notes |
|---|---|---|
| `submitDemoRequest` | `POST /leads/demo-request` | Public — no auth header required; request body mirrors the backend's `CreateDemoRequestDto` field-for-field |

### Users & roles (`features/users/api/users.api.ts`)
| Function | Method + path | Notes |
|---|---|---|
| `listUsers` | `GET /users` | `PaginationQueryDto` only — `page`, `limit`, `sortBy` (default `createdAt`), `sortOrder` (default `desc`). **No search or filter params exist**, which is why the list has no filter row |
| `getUser` | `GET /users/:id` | |
| `updateUser` | `PATCH /users/:id` | `UpdateUserDto` = `PartialType(OmitType(CreateUserDto, ['password']))`. We deliberately never send `roleIds` — see below |
| `removeUser` | `DELETE /users/:id` | Removes **company membership**, not the account. UI copy must reflect that |
| `listRoles` | `GET /roles` | Lives in the users feature: roles are only consumed by user management today. Move when a Roles module exists |

`POST /users` is deliberately **not** wrapped — it requires a plaintext
`password` (an admin choosing someone else's credentials). Invitations exist so
that never happens.

Two documented gaps, both in docs/DEFERRED.md:
- **`UserResponseDto` does not return roles** (D-001). `User.roles` is typed
  optional and rendered when present, so the Role column fills in with no
  frontend change once the backend adds it. Never render "no roles" from its
  absence — absent means *unknown*.
- **`PATCH /users/:id { roleIds }` only ADDS roles** (D-002).
  `UsersService.assignRoles` uses `createMany({ skipDuplicates: true })` and
  returns early on an empty array, so there is no way to remove a role. Hence
  no role editor.

### Invitations (`features/invitations/api/invitations.api.ts`)
| Function | Method + path | Notes |
|---|---|---|
| `accept` | `POST /invitations/accept` | Public — no auth header |
| `list` | `GET /invitations` | **Not paginated** — returns a plain array, unlike `/users` |
| `create` | `POST /invitations` | `roleIds` is required and non-empty; this is the only point where a user's roles can be set |
| `revoke` | `DELETE /invitations/:id` | 204, no body |
| `listDurations` | `GET /invitations/durations` | `{ value, label, days }[]` — fetched, not hardcoded, so options can't drift from the `InvitationDuration` enum |

Unlike users, `InvitationResponseDto` **does** return `roleIds`, so invitations
display their roles (resolved to names via `GET /roles`).

`PERMISSION_DENIED` (thrown by the backend's `PermissionsGuard`) is branched on
across both features via `isPermissionDenied()` in
`features/auth/lib/permissions.ts`, so a 403 reads as "you don't have
permission" rather than a generic failure.

### Accounts (`features/accounts/api/accounts.api.ts`)
Chart of accounts (backend FR-104 — the official 759-account Plan Comptable
Libanais).

| Function | Method + path | Notes |
|---|---|---|
| `listAccounts` | `GET /accounts` | Paginated. Real filter surface: `search`, `type`, `accountClass[]`, `numberPrefix[]`, `isControl`, `isActive`, `parentId` |
| `getTree` | `GET /accounts/tree` | **Unpaginated** — returns the entire chart already nested (`children[]`). Verified: 759 nodes under 7 roots in one response |
| `getAccount` | `GET /accounts/:id` | |
| `getBalance` | `GET /accounts/:id/balance` | Optional `?asOf`; derived from **posted** journal lines only |
| `createAccount` · `updateAccount` | `POST` · `PATCH /accounts/:id` | `PATCH` also expresses deactivate (`isActive`) and re-parent |
| `deleteAccount` | `DELETE /accounts/:id` | Soft delete, 204. **Refused if the account has children** |
| `importOfficialChart` | `POST /accounts/import-official` | Returns `{ imported }`. Once per company |

**`limit` is capped at 100 by the backend**, so `GET /accounts` can never
return the whole 759-account chart. Anything needing *every* account (pickers,
id→name lookups) must read `/accounts/tree` and flatten it —
`useAllAccounts` + `flattenAccountTree` do exactly that. This is not a
micro-optimisation: the partner form's account combobox previously called the
list endpoint with no params and silently offered only the first 20 accounts.

Error codes branched on: `ACCOUNT_NUMBER_EXISTS`, `ACCOUNT_PARENT_CYCLE`,
`ACCOUNT_INVALID_CONTROL` (see `features/accounts/lib/account-errors.ts`) and
`ACCOUNT_HAS_CHILDREN` on delete. Anything else falls back to the generic
translated error.

Accounts carry `name` plus `nameAr`/`nameFr`/`nameEn`. Dense contexts (tree
rows, table cells, comboboxes) show the active language via
`localizedAccountName()`, falling back to `name`; the detail page shows all
three explicitly, since it's the only place with room for the full record.

`GET /accounts/:id/balance` returns **plain base-currency numbers**
(`totalDebitBase`, `totalCreditBase`, `balance`, `naturalBalance`, `asOf`) —
NOT the 4-field `Money` object below, and with no per-currency breakdown
(contrast `PartnerBalance`, which has `byCurrency`). Display `naturalBalance`
rather than `balance`: it's already flipped so a normal-side balance reads
positive. The currency label must come from company settings, not from this
response.

### Companies (`features/companies/api/companies.api.ts`)
Companies (backend FR-101) and their settings (FR-108).

| Function | Method + path | Notes |
|---|---|---|
| `listCompanies` | `GET /companies` | Paginated. **Scoped by caller** — a normal user sees only companies they belong to, a platform admin sees all. The frontend doesn't branch on that |
| `getCompany` | `GET /companies/:id` | Carries `baseCurrencyCode` + `fiscalYearStartMonth` alongside the profile |
| `createCompany` | `POST /companies` | Caller becomes owner + Company Admin; chart of accounts, VAT rate and document sequences are auto-seeded server-side. Requires `company.create` |
| `updateCompany` · `deleteCompany` | `PATCH` · `DELETE /companies/:id` | |
| `getSettings` · `updateSettings` | `GET` · `PATCH /companies/:id/settings` | `baseCurrencyCode`, `fiscalYearStartMonth`, `rounding {decimals, mode}`, `defaultTemplates`, `enabledModules`, `featureFlags`, `fieldVisibility` |

The settings form edits base currency, fiscal year start and rounding.
`baseCurrencyCode` and `fiscalYearStartMonth` are Company *columns* rather than
settings-JSON keys, but the endpoint accepts them so its read and write shapes
agree (backend `967e995` — before that they were silently stripped by
`whitelist: true`, so a save appeared to work and reverted on the next read).
`PATCH /companies/:id` sets them too.

`enabledModules`, `featureFlags`, `fieldVisibility` and `defaultTemplates` are
writable through the same endpoint but have **no documented set of valid
keys**, so there's no UI for them — a free-form JSON editor over live tenant
configuration is a foot-gun. `PATCH` is partial, so they survive a save
untouched.

### Currencies (`features/currencies/api/currencies.api.ts`)
| Function | Method + path | Notes |
|---|---|---|
| `listCurrencies` | `GET /currencies` | Global registry, not per-tenant |
| `getCurrency` | `GET /currencies/:code` | |

Create/update/delete exist backend-side but have no screen and no consumer.

**`decimalPlaces` is load-bearing.** Verified against the live API: `LBP` has
`decimalPlaces: 0`, `USD` has `2`. Rendering "1,250.00 LBP" is *wrong*, not
merely verbose, so amounts must be formatted with their currency's own
decimals — never a hardcoded 2.

## Rendering money
Two different situations, and using the wrong one produces a mislabelled
figure:

- **The row carries its own currency code** (per-currency partner balances,
  transactions in their original currency) → resolve it with
  `useCurrencyLookup()` from `features/currencies`.
- **The API returns a bare base-currency number with no code at all**
  (`/accounts/:id/balance`, the `*Base` fields on `/partners/:id/balance`) →
  use `useBaseCurrency()` from `features/companies`, which joins
  `companies/:id/settings.baseCurrencyCode` to the currency registry.

Then render through `formatMoney(amount, currency, locale)` in
`src/lib/format.ts`. Both hooks return `undefined` while loading or when the
code is unknown, and `formatMoney` then renders the amount **unlabelled**.
That is deliberate: an unlabelled number is incomplete, a mislabelled one is a
lie. Never substitute a default currency.

## Money fields (not yet consumed)
Still not consumed anywhere. The two balance endpoints in use
(`/accounts/:id/balance`, `/partners/:id/balance`) return plain numbers, so
the first real consumer will be Invoicing. When an
invoicing/payments/reporting feature is added, it must consume the backend's
4-field `Money` object exactly as specified in the backend's
`docs/API-DESIGN.md` and `docs/MODELS.md`:
```
{
  "amountOriginal": 8950000,
  "currency": "LBP",
  "rate": 89500,
  "amountBase": 100.00
}
```
- Display `amountOriginal` with `currency` — never `amountBase` — in the UI.
- Never send a bare number for a monetary field in a request body; send the
  full object (or the subset of it the specific endpoint's DTO expects).
- Never perform money math in the frontend beyond formatting/display — all
  totals, VAT, FX conversion, and COGS are server-computed per the backend's
  accounting invariants.
- Format amounts through `formatMoney()` in `src/lib/format.ts`, never a local
  helper — see "Rendering money" above for which currency hook to feed it.

## Adding a new endpoint
When wiring up a new backend endpoint:
1. Add the request/response types to the feature's `{feature}.types.ts`.
2. Add a thin function to the feature's `{feature}.api.ts` using `http`.
3. Add a `useX` hook in the feature's `hooks/` wrapping
   `useQuery`/`useMutation` around that function.
4. In the calling component, branch on any `ApiException.code` values the
   backend docs list for that endpoint; fall back to a generic translated
   error for the rest.
5. If the endpoint returns a paginated list, thread `meta` through using the
   existing `PaginationMeta` type rather than re-deriving pagination fields.
