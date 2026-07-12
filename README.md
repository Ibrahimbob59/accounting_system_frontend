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

1. docs/ARCHITECTURE.md — stack, folder structure, state layers, auth flow
2. docs/CONVENTIONS.md — naming, structure, forms/API patterns, forbidden patterns
3. docs/API-CONTRACTS.md — how this app consumes the backend API, envelope/error handling, endpoints in use

## Getting started

### Prerequisites
- Node.js 22 LTS
- npm
- The accounting-system backend running locally (see that repo's README)

### Local development setup

1. Clone the repository
2. Install dependencies:
   npm install
3. Copy the environment file:
   cp .env.example .env
4. Start the dev server:
   npm run dev

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
