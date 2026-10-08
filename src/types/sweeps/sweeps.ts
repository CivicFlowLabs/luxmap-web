/**
 * Auto-generated Types for: sweeps/sweeps
 * Sinh tự động từ endpoint Backend
 */
import type { DataSource, FixtureStatus, SurveyRawKind, SweepProcessingStatus, SweepStatus } from '../common/enums'

export interface ClipManifest {
    clip_no?: number
    sha256?: string | null
}

export interface CreateSweepRequest {
    work_order_id?: string | null
    client_op_id?: string | null
    boot_session_id?: string | null
    elapsed_anchor_ns?: string | null
    utc_anchor?: string | null
    utc_uncertainty_ms?: number
    data_source?: DataSource
    started_elapsed_ns?: string | null
}

export interface ReviewSweepRequest {
    client_op_id?: string | null
    run_id?: number
    decision?: string | null
    note?: string | null
    expected_version?: number
}

export interface ReviewSweepResponse {
    sweep_id?: string | null
    status?: SweepStatus
    accepted_run_id?: number
    reviewed_by?: string | null
    reviewed_at?: string | null
    note?: string | null
    version?: number
}

export interface SubmitSweepRequest {
    client_op_id?: string | null
    ended_elapsed_ns?: string | null
    manifest?: SweepManifest
}

export interface SurveyClipResponse {
    clip_no?: number
    sha256?: string | null
    byte_count?: number
    content_type?: string | null
}

export interface SurveyRawResponse {
    kind?: SurveyRawKind
    sha256?: string | null
    byte_count?: number
    schema_version?: number
}

export interface SurveyResultItem {
    observation_id?: number
    pole_id?: string | null
    run_id?: number
    pass_id?: number
    direction?: string | null
    evaluated_at?: string | null
    cv_state?: string | null
    cv_confidence?: number
    peak_lux?: number
    baseline_id?: number
    baseline_value?: number
    baseline_ratio?: number
    classified_as?: FixtureStatus
    dim_evaluation_eligible?: boolean
    reason_codes?: string[]
    quality_flags?: string[]
    frame_id?: string | null
    association_confidence?: number
    published_as?: FixtureStatus
    is_representative?: boolean
}

export interface SurveyResultItemPagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: SurveyResultItem[]
}

export interface SweepManifest {
    clips?: ClipManifest[]
    gps_hash?: string | null
    lux_hash?: string | null
    config_hash?: string | null
}

export interface SweepResponse {
    sweep_id?: string | null
    work_order_id?: string | null
    started_at?: string | null
    ended_at?: string | null
    segment_ids?: string[]
    frame_count?: number
    coverage_pct?: number
    processing_status?: SweepProcessingStatus
    status?: SweepStatus
    data_source?: DataSource
    submitted_at?: string | null
    clips?: SurveyClipResponse[]
    raw_files?: SurveyRawResponse[]
    version?: number
}

export interface SweepResponsePagedResult {
    page?: number
    page_size?: number
    total?: number
    items?: SweepResponse[]
}

