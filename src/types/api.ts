export interface ApiSuccess<T> {
  data: T
  meta: PaginationMeta | null
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiErrorBody {
  data: null
  error: {
    code: string
    message: string
    field: string | null
  }
}

export class ApiException extends Error {
  code: string
  field: string | null

  constructor(code: string, message: string, field: string | null) {
    super(message)
    this.name = 'ApiException'
    this.code = code
    this.field = field
  }
}
