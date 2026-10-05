/**
 * Auto-generated Types for: assets/feeders
 * Sinh tự động từ endpoint Backend
 */
import type { TopologyPole } from './segments'

export interface CreateFeederRequest {
    external_ref?: string | null
    feeder_name: string | null
    commune_id: string | null
    geom_wkt?: string | null
}

export interface FeederDetail {
    feeder: FeederListItem
    geom_wkt?: string | null
    created_at: string | null
}

export interface FeederListItem {
    feeder_id: string | null
    external_ref?: string | null
    feeder_name: string | null
    commune_id: string | null
    has_geometry: boolean
    pole_count: number
    updated_at: string | null
}

export interface FeederListItemPagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: FeederListItem[]
}

export interface TopologyPolePagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: TopologyPole[]
}

export interface UpdateFeederRequest {
    external_ref?: string | null
    feeder_name: string | null
    geom_wkt?: string | null
}

