/**
 * Loại tác vụ của lịch làm việc:
 * - survey: Khảo sát tuyến (quét video AI)
 * - inspection: Kiểm tra hiện trường (đo Lux, kiểm tra cột)
 * - repair: Sửa chữa / Thay thế thiết bị
 */
export type TaskKind = 'survey' | 'inspection' | 'repair'

/**
 * Trạng thái của lệnh theo đặc tả Backend:
 * - open: Mới tạo
 * - assigned: Đã giao kỹ sư
 * - in_progress: Đang thực hiện
 * - done: Kỹ sư đã nộp báo cáo (chờ duyệt)
 * - verified: Quản lý đã duyệt nghiệm thu
 * - returned: Quản lý trả về yêu cầu sửa lại
 * - closed: Đã hoàn tất và đóng
 * - canceled: Bị hủy / Quản lý không duyệt (Tự END)
 */
export type WorkOrderStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'done'
  | 'verified'
  | 'returned'
  | 'closed'
  | 'canceled'

export type InspectionOutcome = 'fault_present' | 'fault_absent' | 'inconclusive'

export interface WorkOrderLocation {
  lat: number
  lng: number
}

export interface WorkOrderFaultDetail {
  faultId: string
  poleId?: string
  segmentId?: string
  location: WorkOrderLocation
  faultType: string
  faultStatus: string
  severity: string
  inspectionOutcome?: InspectionOutcome
}

export interface WorkOrderAssignee {
  userId: string
  fullName: string
}

export interface WorkOrderItem {
  workOrderId: string
  title: string
  communeId: string
  taskKind: TaskKind
  segmentId?: string
  clusterId?: string
  faultIds: string[]
  woStatus: WorkOrderStatus
  assignedTo?: string
  priorityScore?: number
  createdAt: string
  updatedAt: string
  dueDate?: string
  scheduledDate?: string
  caseCode?: string
  materialsNote?: string
}

export interface WorkOrderDetail extends WorkOrderItem {
  note?: string
  reviewNote?: string
  reportNote?: string
  createdBy: string
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  closedAt?: string
  assigneeEligible?: boolean
  allowedActions: string[]
  faults: WorkOrderFaultDetail[]
  videoUrl?: string
  evidenceUrls?: string[]
}

// ==========================================
// CẤU TRÚC HỒ SƠ SỰ VỤ & THANH TIẾN TRÌNH (STEPPER)
// ==========================================

export interface SchedulePhase {
  phaseType: TaskKind
  name: string
  date: string
  assigneeId: string
  assigneeName: string
  status: 'pending' | 'reported' | 'ended'
  notes?: string
  materialsNote?: string // Ghi chú vật tư tự do (textarea)
  workOrderId?: string
  poleIds?: string[] // Danh sách các cột đèn cụ thể cần kiểm tra / sửa chữa
  report?: {
    submittedAt: string
    summary: string
    videoUrl?: string
    photoEvidence?: string[]
    luxMeasured?: string
    suggestedMaterialsNote?: string // Kỹ sư tự do nhập ghi chú đề xuất
    usedMaterialsNote?: string      // Kỹ sư nhập / Quản lý tự do chỉnh sửa
    aiDetections?: Array<{
      poleId: string
      issue: string
      confidence: number
    }>
  }
}

export interface ScheduleCase {
  code: string                  // Ví dụ: SCH-001 (giữ nguyên xuyên suốt)
  title: string
  segment: string
  currentPhaseIndex: number     // 0: Khảo sát, 1: Kiểm tra, 2: Sửa chữa, 3: Cấp trên
  isTerminated: boolean         // True nếu bị từ chối duyệt hoặc đóng sớm
  endReason?: string
  poleIds?: string[]            // Cột đèn liên quan của sự vụ
  phases: SchedulePhase[]       // Lịch sử các giai đoạn
}

// ==========================================
// PAYLOADS GỬI LÊN BACKEND API
// ==========================================

export interface CreateWorkOrderPayload {
  taskKind: TaskKind
  title: string
  segmentId?: string
  assignedTo?: string
  scheduledDate?: string
  dueDate?: string
  note?: string
  faultIds?: string[]
  poleIds?: string[]
  communeId?: string
  caseCode?: string
  materialsNote?: string
}

export interface PatchWorkOrderPayload {
  title?: string
  dueDate?: string
  scheduledDate?: string
  assignedTo?: string
  segmentId?: string
  taskKind?: TaskKind
}

export interface AssignWorkOrderPayload {
  assignedTo: string
}

export interface CompleteWorkOrderPayload {
  reportNote: string
  faultOutcomes?: Array<{
    faultId: string
    outcome: InspectionOutcome
  }>
  materialsNote?: string
}

export interface ReviewWorkOrderPayload {
  note?: string
  materialsNote?: string
}
