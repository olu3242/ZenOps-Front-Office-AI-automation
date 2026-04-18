export interface PagedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

export const PAGE_SIZE = 25
