# Deferred

Things intentionally left incomplete, and what it will take to finish them.

Mirrors the backend repo's `docs/DEFERRED.md` convention: anything shipped as
a placeholder gets a `TODO(...)` at the code site **and** a row here. A `TODO`
with no row here is a bug in the process — the whole point is that these stay
findable after the person who wrote them has moved on.

Each entry states what we do today, *why* (usually: the backend can't tell us
yet), and the exact follow-up. None of these are "someday" cleanups — they all
unblock the moment a named backend change lands.

---

## D-001 — A user's roles are not displayed

**Today:** `UsersListPage` renders a Role column whose cells are empty.

**Why:** `UserResponseDto` (backend `src/modules/users/dto/user-response.dto.ts`)
returns `id, firstName, lastName, email, phone, avatarUrl, preferredLanguage,
isActive, lastLoginAt, isPlatformAdmin, createdAt, updatedAt` — no roles. The
users *do* have roles in the database; the API simply doesn't expose them, so
the frontend has no way to read them.

An empty column is deliberate over omitting the column entirely: the frontend
type already declares `roles?: Role[]` and the cell already renders them when
present, so the day the API includes the field, the column fills in with **no
frontend change at all**. Nothing here fakes or guesses a value.

**Blocked on (backend):** add `roles` to `UserResponseDto`, populated in
`UsersService.findAll`/`findOne`.

**Then, in this repo:** nothing required. Optionally add role filtering to the
list once the data is actually there.

---

## D-002 — Role assignment for existing users

**Today:** roles can be chosen when *inviting* a user, and not changed
afterwards. There is no role-editing UI.

**Why:** two separate backend limits, and the second is the blocking one:
1. We can't display current roles (see [D-001]) — an editor can't pre-select
   what it can't read.
2. `UsersService.assignRoles` uses `createMany({ skipDuplicates: true })` and
   returns early on an empty array, so `PATCH /users/:id { roleIds }` only ever
   **adds** roles. There is no way to remove one. A role editor built on that
   would be a one-way door: every mistake is permanent.

Invitations are unaffected — `CreateInvitationDto.roleIds` is required and set
at creation, so the primary path for getting a user their roles is complete.

**Blocked on (backend):** D-001, plus a role-*removal* path — either making
`assignRoles` replace the set, or a dedicated
`DELETE /users/:id/roles/:roleId`.

**Then, in this repo:** add a role editor to the user detail page, pre-checked
from `user.roles`.

---

## D-003 — UI is not gated on the current user's permissions

**Today:** `usePermission()` (`src/features/auth/lib/permissions.ts`) returns
`true` for every key, so every action is rendered for every user. A denied
action fails server-side and surfaces a specific "you don't have permission"
message rather than a generic error.

**Why:** `GET /auth/me` returns `activeCompanyId`, `companies` and
`mustChangePassword` — not the caller's permissions — and there is no other
endpoint that reports them for the *current* user. `GET /permissions` lists
every permission that exists in the system, not the ones you hold.

The check is centralized rather than inlined precisely so this is cheap to
finish: every gate in the app already calls `usePermission`, so switching it
from a constant to real data is a one-file change, not an audit of every
button. The 403 handling is not a workaround and stays permanently — a client
should never be the only thing standing between a user and an action.

**Blocked on (backend):** add `permissions: string[]` to `MeResponseDto`.

**Then, in this repo:** store it on the auth store alongside `companies`, and
have `usePermission` read from there. Every gate updates automatically.

---

## D-004 — Base-currency amounts are not self-describing

**Fully documented in the backend repo: `docs/URGENT.md`** (commit `9fc9140`).
Read that first — it holds the incident report, root cause, the complete
inventory of affected endpoints, the approaches that don't work, the proposed
schema fix and the test plan. This entry is only the frontend-side summary.

**Today:** base currency is freely editable. Balance amounts are labelled using
the company's *current* `baseCurrencyCode`, joined to the currency registry by
`useBaseCurrency` (`src/features/companies/hooks/useBaseCurrency.ts`) and
rendered via `formatMoney`.

**Why:** `/accounts/:id/balance` and the partner `*Base` fields return plain
numbers with **no currency field**, so the client has to infer it. Nothing in
the backend records which currency a stored `amountBase` was computed in —
`amountBase` is frozen at posting, `Company.baseCurrencyCode` is mutable, and
nothing links them. Change the setting and a 100 USD balance reports "100 LBP".

**Not a frontend bug, and not fixable here.** An earlier attempt locked the
base-currency picker once postings existed; it was reverted. It removed a
legitimate capability (presentation vs functional currency, IAS 21) and put an
accounting policy decision in a client, where it can't be enforced anyway.

**Blocked on (backend):** `docs/URGENT.md` §6 — store `baseCurrencyCode` on
`JournalLine` beside `amountBase`, then return it from the balance responses.

**Then, in this repo** (`docs/URGENT.md` §7):
1. Read the currency straight from the balance payload.
2. Delete `useBaseCurrency` and its two-request join.
3. Keep `formatMoney` and keep taking `decimalPlaces` from `GET /currencies` —
   LBP is a 0-decimal currency.
4. Keep rendering unlabelled when the currency is genuinely unknown.
5. If the backend adds `?presentIn=`, surface the returned rate and rate date
   next to any converted figure — never a converted number on its own.

---

## D-005 — `PATCH /companies/:id/settings` ignored two fields it returned — RESOLVED

**Resolved** by backend commit `967e995`. Kept here as the record of what the
bug was, since the shape of it is worth recognising again.

`GET /companies/:id/settings` returned `baseCurrencyCode` and
`fiscalYearStartMonth` (copied from the Company columns by `resolveSettings`),
but `UpdateCompanySettingsDto` declared neither, and the app runs
`ValidationPipe` with `whitelist: true`. Sending them therefore succeeded,
stripped them, changed nothing, and echoed the old values back — which reads to
a user as "it reverted on refresh", and gives a developer a 200 with a
correct-looking response body.

**The lesson:** an endpoint whose read and write shapes disagree fails
silently. Verifying the GET shape live is not evidence the PATCH accepts the
same fields — this was assumed, and the write path was never tested until a
user hit it.

Both fields are now on the DTO and written to their own Company columns.
Frontend: the Settings tab edits them again; the read-only workaround is gone.
