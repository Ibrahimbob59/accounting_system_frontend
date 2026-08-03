# Manual testing walkthrough

A click-through of the screens this app ships, in the order that builds on
itself. There is no automated UI test suite yet, so this is the checklist.

Each step says what to expect and, where relevant, *why* — a step whose
expected result you can't justify isn't a test, it's a habit.

**Prerequisites:** backend, Postgres, Redis and Mailpit running, and the
frontend on `:5173`. See README → *Running on a new machine*.

**Test account used below:** `owner@demo.example.com`. It belongs to two
companies, so it exercises the company-selection path that a single-company
user never sees.

---

## 0. Sign in

1. Open http://localhost:5173 → the marketing landing page.
2. **Sign in** → `/login`.
3. Log in.

**Expect:** because this user belongs to more than one company, you land on
`/select-company` rather than the dashboard. Pick **Demo Company**.

A single-company user skips this screen entirely — the backend sets their
active company automatically, and the routing resolver sends them straight to
`/app`.

---

## 1. Companies — `/app/companies`

The last nav item. This module didn't exist before; company data was only
reachable through the switcher.

- Two rows: **Demo Company** and **Second Company**.
- **Demo Company** carries a green **"Active company"** badge. That's the one
  thing `/select-company` cannot tell you — which company you're currently
  working in.
- Both show a base currency and a fiscal-year start month.

**Why it matters:** `GET /companies` is scoped by the caller — a normal user
sees only their own companies, a platform admin sees every tenant. The screen
doesn't branch on role; the API does.

---

## 2. Create a company

**New company** → name it e.g. `Test Co`, set **base currency to LBP**, save.

**Expect:**
- You land on its detail page.
- You are **still in Demo Company** — creating deliberately doesn't switch you,
  because changing the active tenant under someone mid-task is hostile.
- Back on the list it's a third row, with no "Active" badge.

**Behind the scenes** the backend makes you its owner and Company Admin, and
seeds its chart of accounts, VAT rate and document sequences. Until this screen
existed there was no way to create a company from the UI at all.

Keep `Test Co` — §5 uses it.

---

## 3. Switch company from the detail page

Open **Second Company** → **Switch to this company**.

**Expect:** you land on the dashboard and the "Active company" badge has moved.

**Watch for:** being bounced to `/login`. This is the riskiest path in the
module — switching reissues your session token, so the response has to be
applied through the same post-auth path login uses. If it half-applies, you get
logged out.

Switch back to **Demo Company** afterwards.

---

## 4. Chart of accounts — `/app/accounts`

Demo Company has ~760 accounts (the official Plan Comptable Libanais), Second
Company ~759.

1. **Tree** tab (default): 7 top-level classes, expandable. This is why the tree
   exists — 759 rows flat is not navigable.
2. Type `41` in **Search** → it should **switch to the List tab automatically**
   and show ~26 matches (`41 Customers`, `411 Customer invoices`,
   `4111 Ordinary customers`).
   *Why the switch:* filtering a tree either hides matching descendants or
   leaves orphaned branches. One honest view beats two half-working ones.
3. Open an account → the detail shows **all three names** (Arabic, French,
   English). The Arabic names are real backend data, e.g.
   `حسابات الرساميل الدائمة` — not placeholders.
4. Tree and list rows show only the name for the **active language**, falling
   back to the base name. Three names per row across 759 rows is unreadable.
5. On **Test Co**, try **Import official chart**. It's already seeded at
   creation, so this mainly exercises the confirmation dialog and the result
   toast.

---

## 5. Currency display — read `docs/DEFERRED.md` → D-004 first

**Do this on `Test Co`, which has no postings. Not on Demo Company.**

Demo Company has posted journal entries, and changing its base currency
triggers a known, documented backend defect (amounts get relabelled without
being converted). Full write-up: backend repo `docs/URGENT.md`.

On `Test Co` (base currency LBP, no postings):

1. Open any account → **Balance**.
2. It should read **`0 LBP`** — **not** `0.00 LBP`.
3. Change its base currency to **USD** (Settings tab), reopen the balance → now
   **`0.00 USD`**.

**Why this is the interesting case:** LBP is a zero-decimal currency
(`decimalPlaces: 0` in the currency registry); USD is 2. Amounts are formatted
using the currency's own decimals, not a hardcoded 2. `1,250.00 LBP` is wrong,
not merely verbose.

Also on the Settings tab:
- **Rounding decimals** accepts 0–6, rejects 7.
- Base currency and fiscal-year start **persist across a page refresh**. They
  used to silently revert — fixed in backend `967e995`.

---

## 6. Users & invitations — `/app/users`

**Members tab**

- Lists company members with a **Roles** column that is **empty on purpose**.
  The API doesn't return user roles yet (`docs/DEFERRED.md` → D-001). The column
  exists so it fills in by itself when the backend adds the field — and it's
  blank rather than `—` because absent means *unknown*, not *none*. Claiming a
  user has no roles would be worse than showing nothing.

**Invite a user**

1. **Invite user** → email, optional first/last name, pick **at least one
   role**, choose an expiry.
2. Send. Expect a success toast.
3. Open **Mailpit** at http://localhost:8025 → the invitation email is there
   with an accept link.

   *If Mailpit is empty:* check `MAIL_TRANSPORT=smtp` in the backend `.env` —
   `log` prints emails to the server console instead of sending them. Changing
   it needs a **backend restart**; `.env` is read only at boot.

4. Open the accept link (a private window is easiest). Expect a **success card
   with a "Go to login" button** — not an endless spinner.

   *Why this is worth checking:* it used to hang forever after a successful
   accept. The request went through, then the UI never learned it had.

5. **Pending invitations** tab → the invitation appears with its roles, and can
   be revoked.

   Roles show here even though they're blank on the Members tab — the
   invitation endpoint *does* return `roleIds`. Same reason: show what the API
   actually gives you.

---

## 7. Partners — the account picker

`/app/partners` → open a partner → **Edit** → the **Receivable account**
dropdown.

**Expect:** all ~759 accounts are offered.

**Why:** it previously listed only the first 20. It called the paginated
`/accounts` endpoint with no params, and `limit` is capped at 100 by the
backend, so no single call can return the full chart. It now reads
`/accounts/tree`, which is unpaginated.

---

## 8. Dashboard and shell

- `/app` — stat cards for partners, users and accounts. A card whose endpoint
  403s shows a quiet `—` rather than breaking the page.
- **Sidebar collapse** (bottom of the rail) → collapses to a 76px icon rail with
  tooltips; expands back.
- The sidebar stays **dark in both light and dark mode**. That's deliberate
  fixed "chrome", not a theming bug.

---

## 9. Internationalisation and theming

- **Language switcher** → French, then Arabic.
  - Arabic mirrors the layout (RTL): the sidebar moves to the right, back-arrows
    and chevrons flip.
  - Month names in the fiscal-year dropdown follow the active language — they're
    produced by `toLocaleString`, not translated by hand in three files.
- **Dark mode** toggle → surfaces and text invert; the accent green and the
  status colours (danger / warning / info) stay identical, by design.

---

## 10. Error and edge paths

- Visit `/app/nonsense` → the Not Found page, not a blank screen.
- Log out from the user menu → back to `/login`; visiting `/app` afterwards
  redirects to login rather than rendering an empty shell.
- **Forgot password** → enter an address, then read the 6-digit code from
  Mailpit. The code field is the one input with its own type treatment (wide
  letter-spacing) so a mistyped digit is visible.

---

## Known-failing / do not test

These are documented defects, not regressions. Filing them again wastes time.

| Behaviour | Where it's documented |
|---|---|
| Changing base currency on a company **with postings** relabels amounts without converting them | backend `docs/URGENT.md`; frontend `docs/DEFERRED.md` → D-004 |
| The **Roles** column on the Members tab is always empty | `docs/DEFERRED.md` → D-001 |
| No way to change an existing user's roles | `docs/DEFERRED.md` → D-002 |
| Every action is visible to every user, including ones the API will reject with 403 | `docs/DEFERRED.md` → D-003 |

A 403 should surface a specific "you don't have permission" message, not a
generic error. *That* is worth reporting if it doesn't.
