import { http } from '@/lib/api-client'
import type {
  DemoRequestBody,
  DemoRequestResponse,
} from '@/features/leads/types/leads.types'

/** Public (no-auth) lead capture. See API-CONTRACTS.md → Leads. */
export const leadsApi = {
  submitDemoRequest(body: DemoRequestBody): Promise<DemoRequestResponse> {
    return http.post<DemoRequestResponse>('/leads/demo-request', body)
  },
}
