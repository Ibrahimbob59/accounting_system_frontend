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

## Money fields (not yet consumed)
No feature in this repo renders monetary data yet (current scope is auth +
marketing/leads only). When an accounting/invoicing/reporting feature is
added, it must consume the backend's 4-field `Money` object exactly as
specified in the backend's `docs/API-DESIGN.md` and `docs/MODELS.md`:
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
