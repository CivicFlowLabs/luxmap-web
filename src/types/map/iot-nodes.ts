/**
 * Auto-generated Types for: map/iot-nodes
 * Sinh tự động từ endpoint Backend
 */
import type { NodeRole, NodeStatus } from '../common/enums'
import type { Geometry } from '../common/base'

export interface IotNodeProperties {
    node_id: string | null
    node_role: NodeRole
    node_status: NodeStatus
    pole_id?: string | null
    segment_ids: string | null[]
    feeder_ids: string | null[]
    supports_remote_control: boolean
    last_report_at?: string | null
}

export interface IotNodePropertiesFeature {
    type?: string | null
    geometry: Geometry
    properties: IotNodeProperties
}

export interface IotNodePropertiesFeatureCollection {
    type?: string | null
    crs_note?: string | null
    features: IotNodePropertiesFeature[]
}

