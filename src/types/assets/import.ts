/**
 * Auto-generated Types for: assets/import
 * Sinh tự động từ endpoint Backend
 */
export interface ImportResult {
    inserted?: number
    updated?: number
    unchanged?: number
    failed?: number
    total_errors?: number
    truncated?: boolean
    rows?: ImportRowError[]
    total_warnings?: number
    warnings?: ImportRowError[]
}

export interface ImportRowError {
    row?: number
    column?: string | null
    message?: string | null
}

