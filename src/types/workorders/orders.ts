/**
 * Auto-generated Types for: workorders/orders
 * Sinh tự động từ endpoint Backend
 */
import type { EvidenceKind, FaultStatus, FaultType, FixtureStatus, FixtureType, InspectionOutcome, Severity, TaskKind, WorkOrderStatus } from '../common/enums'

export interface AssignWorkOrderRequest {
    assigned_to: string | null
}

export interface CompleteWorkOrderRequest {
    report_note: string | null
    materials_used?: string | null
    fault_outcomes?: FaultOutcomeRequest[]
}

export interface CreateWorkOrderRequest {
    task_kind: TaskKind
    title: string | null
    fault_ids?: string | null[]
    segment_id?: string | null
    segment_ids?: string | null[]
    assigned_to?: string | null
    due_date?: string | null
    scheduled_date?: string | null
    note?: string | null
    materials_note?: string | null
    commune_id?: string | null
}

export interface EvidenceItem {
    evidence_id: string | null
    work_order_id?: string | null
    fault_id?: string | null
    kind?: EvidenceKind
    captured_at?: string | null
    lat?: number
    lng?: number
    uploaded_by: string | null
    uploaded_at?: string | null
    thumbnail_url: string | null
    original_url: string | null
}

export interface EvidenceItemPagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: EvidenceItem[]
}

export interface FaultOutcomeRequest {
    fault_id?: string | null
    outcome?: InspectionOutcome
}

export interface FollowUpWorkOrderRequest {
    task_kind: TaskKind
    title?: string | null
    fault_ids?: string | null[]
    assigned_to?: string | null
    due_date?: string | null
    scheduled_date?: string | null
    note?: string | null
    materials_note?: string | null
}

export interface PatchWorkOrderRequest {
    title?: string | null
    due_date?: string | null
    scheduled_date?: string | null
    materials_note?: any
}

export interface ReviewWorkOrderRequest {
    note?: string | null
}

export interface WorkOrderAssignee {
    user_id?: string | null
    full_name?: string | null
}

export interface WorkOrderAssigneePagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: WorkOrderAssignee[]
}

export interface WorkOrderDetail {
    work_order_id: string | null
    title: string | null
    commune_id: string | null
    task_kind?: TaskKind
    segment_id?: string | null
    cluster_id?: string | null
    parent_work_order_id?: string | null
    case_id: string | null
    fault_ids: string | null[]
    wo_status?: WorkOrderStatus
    assigned_to?: string | null
    priority_score?: number
    created_at?: string | null
    updated_at?: string | null
    due_date?: string | null
    scheduled_date?: string | null
    segment_ids?: string | null[]
    note?: string | null
    review_note?: string | null
    report_note?: string | null
    materials_note?: string | null
    materials_used?: string | null
    created_by: string | null
    assigned_at?: string | null
    started_at?: string | null
    completed_at?: string | null
    closed_at?: string | null
    assignee_eligible?: boolean
    allowed_actions: string | null[]
    faults: WorkOrderFaultDetail[]
}

export interface WorkOrderFaultDetail {
    fault_id?: string | null
    pole_id?: string | null
    segment_id?: string | null
    location?: WorkOrderLocation
    fault_type?: FaultType
    fault_status?: FaultStatus
    severity?: Severity
    inspection_outcome?: InspectionOutcome
}

export interface WorkOrderItem {
    work_order_id: string | null
    title: string | null
    commune_id: string | null
    task_kind?: TaskKind
    segment_id?: string | null
    cluster_id?: string | null
    parent_work_order_id?: string | null
    case_id: string | null
    fault_ids: string | null[]
    wo_status?: WorkOrderStatus
    assigned_to?: string | null
    priority_score?: number
    created_at?: string | null
    updated_at?: string | null
    due_date?: string | null
    scheduled_date?: string | null
}

export interface WorkOrderItemPagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: WorkOrderItem[]
}

export interface WorkOrderLocation {
    lat?: number
    lng?: number
}

export interface WorkOrderPole {
    pole_id: string | null
    segment_id: string | null
    position?: number
    location: WorkOrderLocation
    fixture_status?: FixtureStatus
    status_confidence?: number
    last_seen_at?: string | null
    open_fault_count?: number
    near_sensitive_poi?: boolean
    fixture_type?: FixtureType
    lamp_watt?: number
    work_order_fault_ids: string | null[]
    note?: string | null
}

export interface WorkOrderPolePagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: WorkOrderPole[]
}

