import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  Company,
  CompanySettings,
  CreateCompanyDto,
  ListCompaniesQuery,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
} from '@/features/companies/types/companies.types'

/**
 * Companies (backend FR-101) + their settings (FR-108).
 *
 * `GET /companies` is scoped by the caller: a platform admin sees every
 * company, a normal user sees only the ones they belong to. So this is both
 * "the companies I can switch to" and, for an admin, the tenant list — the
 * frontend doesn't need to branch on that.
 */
export const companiesApi = {
  listCompanies(query?: ListCompaniesQuery): Promise<ApiSuccess<Company[]>> {
    return http.getPage<Company[]>('/companies', { params: query })
  },

  getCompany(id: string): Promise<Company> {
    return http.get<Company>(`/companies/${id}`)
  },

  /** The caller becomes owner + Company Admin of the new company, and the
   * chart of accounts, default VAT rate and document sequences are seeded for
   * it server-side. Requires `company.create`, which a Member-only user
   * doesn't hold. */
  createCompany(dto: CreateCompanyDto): Promise<Company> {
    return http.post<Company>('/companies', dto)
  },

  updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    return http.patch<Company>(`/companies/${id}`, dto)
  },

  deleteCompany(id: string): Promise<void> {
    return http.delete<void>(`/companies/${id}`)
  },

  getSettings(id: string): Promise<CompanySettings> {
    return http.get<CompanySettings>(`/companies/${id}/settings`)
  },

  updateSettings(
    id: string,
    dto: UpdateCompanySettingsDto
  ): Promise<CompanySettings> {
    return http.patch<CompanySettings>(`/companies/${id}/settings`, dto)
  },
}
