/**
 * Auto-generated Types for: assets/import
 * Sinh tự động từ endpoint Backend
 */
export interface ImportResult {
    inserted?: number
    updated?: number
    failed?: number
    total_errors?: number
    truncated?: boolean
    rows?: ImportRowError[]
}

export interface ImportRowError {
    row?: number
    column?: string | null
    message?: string | null
}

