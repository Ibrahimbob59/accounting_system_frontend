# Temporary API mocks

⚠️ **TODO(backend): delete this directory once the real backend is running.**

There is no backend yet. These [MSW](https://mswjs.io) handlers (`handlers.ts`)
fake just enough of the API — login, session bootstrap, dashboard counts,
invitation accept, demo-request — so the app is usable for frontend work
without a server.

## How it's wired in

- Enabled only when `VITE_USE_MOCKS=true` is set in `.env` (see `.env.example`).
- Started in `src/main.tsx` before the app renders, and only in dev builds.
- Login credentials: `1@1.com` / `11111111` (see `db.ts`). Plain `1`/`1` won't
  work — the login form validates email format and an 8-char password minimum
  client-side before it ever reaches the mock.
- Password-reset code: always `123456`.

## When the real backend is ready

1. Point `VITE_API_BASE_URL` at it in `.env`.
2. Delete `VITE_USE_MOCKS` from `.env` (or set it to `false`).
3. Delete `src/mocks/` and the bootstrap block in `main.tsx` that references it.
4. Delete `public/mockServiceWorker.js` and the `msw` devDependency.
