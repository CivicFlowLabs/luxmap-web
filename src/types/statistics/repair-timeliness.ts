/**
 * Auto-generated Types for: statistics/repair-timeliness
 * Sinh tự động từ endpoint Backend
 */
export interface RepairTimelinessRow {
    commune_id: string | null
    completed: number
    on_time: number
    late: number
    no_due_date: number
    on_time_rate: number
    open_overdue: number
}

export interface RepairTimelinessStatistics {
    from: string | null
    to: string | null
    as_of: string | null
    group_by: string[]
    rows: RepairTimelinessRow[]
}

