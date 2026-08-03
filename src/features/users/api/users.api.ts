import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  ListUsersQuery,
  Role,
  UpdateUserDto,
  User,
} from '@/features/users/types/users.types'

/**
 * `listRoles` lives here rather than in its own feature: roles are only ever
 * consumed *by* user management today (the invite dialog's role picker), and
 * there's no role-administration screen. Same precedent as partners.api.ts
 * owning `listCurrencies`/`listAccounts`. Move it out the day a real Roles
 * module exists.
 *
 * `POST /users` is deliberately not wrapped. It requires a plaintext
 * `password`, i.e. an admin choosing another person's credentials — the
 * invitation flow exists precisely so that never happens, so exposing it here
 * would invite a screen that shouldn't be built.
 */
export const usersApi = {
  listUsers(query: ListUsersQuery): Promise<ApiSuccess<User[]>> {
    return http.getPage<User[]>('/users', { params: query })
  },

  getUser(id: string): Promise<User> {
    return http.get<User>(`/users/${id}`)
  },

  updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    return http.patch<User>(`/users/${id}`, dto)
  },

  /** Removes the user's membership of the active company — it does not delete
   * the person's account (backend users.service.ts). The confirm copy must say
   * so, or it reads as destroying their login. */
  removeUser(id: string): Promise<void> {
    return http.delete<void>(`/users/${id}`)
  },

  listRoles(): Promise<Role[]> {
    return http.get<Role[]>('/roles')
  },
}
