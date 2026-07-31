import { setupWorker } from 'msw/browser'

import { handlers } from '@/mocks/handlers'

// TODO(backend): delete this whole mocks/ directory once the real API is up —
// see src/mocks/README.md.
export const worker = setupWorker(...handlers)
