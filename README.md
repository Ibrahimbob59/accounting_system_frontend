# accounting-system-frontend

Web back-office frontend for the accounting-system ERP platform — a
multi-tenant, dual-currency ERP for Lebanese trading companies. This is one
of several clients of the accounting-system backend (a separate NestJS repo);
the others are a Flutter POS terminal and a Flutter mobile app.

## Tech stack
- React 19 + Vite
- TypeScript (strict)
- React Router v7, TanStack Query v5, Zustand v5
- react-hook-form + Zod
- shadcn/ui + Tailwind CSS v4
- i18next (en / fr / ar, with RTL support)

## Documentation
Before writing any code, read these files in order:

1. `docs/ARCHITECTURE.md` — stack, folder structure, state layers, auth flow
2. `docs/CONVENTIONS.md` — naming, structure, forms/API patterns, forbidden patterns
3. `docs/API-CONTRACTS.md` — how this app consumes the backend API, envelope/error handling, endpoints in use
4. `docs/DEFERRED.md` — known gaps shipped on purpose, and the backend change each one waits on
5. `docs/MANUAL-TESTING.md` — click-through checklist for the screens that exist

## Running on a new machine

The frontend is only useful with the backend running, and the backend needs
Postgres, Redis and an SMTP catcher. Full sequence, from nothing:

### 1. Install prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 LTS or newer | `node -v` |
| npm | ships with Node | `npm -v` |
| PostgreSQL | 16+ | Runs **natively on the host**, not in Docker |
| Docker Desktop | any recent | Only for Redis + Mailpit |

### 2. Start the backend's dependencies

Postgres runs on the host and must be listening on `5432` before anything else.
Create the database and role the backend expects (defaults shown; match them to
the backend's `.env`):

```sql
CREATE ROLE accounting_user WITH LOGIN PASSWORD 'accounting_pass';
CREATE DATABASE accounting_db OWNER accounting_user;
```

Then start Redis and Mailpit — Docker Desktop must be running first, or
`docker compose` fails with a daemon/pipe error:

```bash
cd ../accounting-system
docker compose up -d          # redis :6379, mailpit :1025 + UI :8025
```

### 3. Start the backend

```bash
cd ../accounting-system
npm install
cp .env.example .env          # then edit: DB credentials, JWT secrets
npx prisma migrate deploy     # NOT `migrate dev` — see that repo's PROGRESS.md
npx prisma db seed            # currencies, roles, permissions, platform admin
npm run start:dev             # http://localhost:3001
```

Check http://localhost:3001/api/docs — Swagger should load.

Two backend `.env` values matter to this app:

- **`PORT`** must match `VITE_API_BASE_URL` below.
- **`CORS_ORIGINS`** must include `http://localhost:5173`, or every request
  from the browser is blocked regardless of anything else.
- **`MAIL_TRANSPORT`** — `smtp` delivers to Mailpit (readable at `:8025`);
  `log` prints emails to the server console and sends nothing. Invitation and
  password-reset links live in whichever you pick. Changing it needs a backend
  restart; `.env` is only read at boot.

### 4. Start this app

```bash
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

Edit `.env`:

```
VITE_API_BASE_URL=http://localhost:3001/api/v1   # must match the backend PORT
VITE_USE_MOCKS=false                             # true = no backend needed
```

`VITE_USE_MOCKS=true` serves fake responses from `src/mocks/` so the UI runs
with no backend at all — useful for pure UI work, and it shows an orange banner
so you can't mistake it for real data.

### 5. Verify

- http://localhost:5173 → landing page
- Log in, then walk `docs/MANUAL-TESTING.md`

### Common problems

| Symptom | Cause |
|---|---|
| Every request fails in the browser, but `curl` works | `CORS_ORIGINS` doesn't include `http://localhost:5173` |
| `404` on every API call | `VITE_API_BASE_URL` port doesn't match the backend `PORT` |
| Invitation/reset emails never arrive in Mailpit | `MAIL_TRANSPORT=log`, or Docker isn't running |
| `docker compose` fails on a pipe/daemon error | Docker Desktop isn't started |
| Backend dies with `Cannot find module dist/main` | `npm run build` was run while `start:dev` was watching — restart it |
| Vite changes don't appear | `.env` changes need a dev-server restart, unlike source files |

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build — **the standard check** |
| `npm run lint` | ESLint |
| `npm run format` | Prettier over `src/` |
| `npm run preview` | Serve the production build locally |

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
