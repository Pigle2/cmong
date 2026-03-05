export * from './database'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface SearchParams {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  sort?: 'recommended' | 'newest' | 'rating' | 'orders' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}
