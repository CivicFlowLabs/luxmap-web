/**
 * Auto-generated Types for: device/commands
 * Sinh tự động từ endpoint Backend
 */
import type { FeederControlMode, LightingAckResult, LightingCommandStatus } from '../common/enums'

export interface DeviceAckRequest {
    seq: number
    result: LightingAckResult
    reported_mode?: FeederControlMode
    error?: string | null
}

export interface DeviceAckResult {
    command_id?: string | null
    status?: LightingCommandStatus
}

export interface DeviceCommand {
    command_id?: string | null
    seq?: number
    relay_no?: number
    mode?: FeederControlMode
    expires_at?: string | null
}

export interface DeviceCommandBatch {
    server_time?: string | null
    commands?: DeviceCommand[]
}

