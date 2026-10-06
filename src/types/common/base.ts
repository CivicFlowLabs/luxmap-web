/**
 * Base Types & Error Wrappers
 * Tự động sinh từ Backend Swagger
 */
export interface ApiError {
    code?: string | null
    message?: string | null
    details?: Record<string, any>
}

export interface ApiErrorResponse {
    error?: ApiError
}

export interface AssetLocation {
    lat: number
    lng: number
}

export interface Geometry {
    type: string | null
    coordinates: any
}

export interface PageQuery {
    page?: number
    page_size?: number
}

export interface UserDto {
    id?: string | null
    username?: string | null
    email?: string | null
    full_name?: string | null
    role?: string | null
    commune_ids?: string[]
}

export interface PaginationMeta {
    page: number
    pageSize: number
    total: number
    totalPages: number
}
