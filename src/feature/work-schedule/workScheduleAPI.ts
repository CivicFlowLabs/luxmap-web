import { apiClient } from '../../config/apiClient'
import {
  WorkOrderItem,
  WorkOrderDetail,
  WorkOrderAssignee,
  CreateWorkOrderPayload,
  PatchWorkOrderPayload,
  AssignWorkOrderPayload,
  CompleteWorkOrderPayload,
  ReviewWorkOrderPayload,
} from '../../types/workSchedule'

export interface GetWorkOrdersFilter {
  scheduled_from?: string
  scheduled_to?: string
  task_kind?: string
  wo_status?: string
  assigned_to?: string
  segment_id?: string
  commune_id?: string[]
  page?: number
}

export interface PagedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export const workScheduleAPI = {
  /**
   * Lấy danh sách lệnh công tác / lịch làm việc (hỗ trợ lọc theo khoảng ngày để vẽ calendar)
   */
  async getWorkOrders(filter?: GetWorkOrdersFilter): Promise<PagedResponse<WorkOrderItem>> {
    const params: Record<string, any> = {}
    if (filter?.scheduled_from) params.scheduled_from = filter.scheduled_from
    if (filter?.scheduled_to) params.scheduled_to = filter.scheduled_to
    if (filter?.task_kind) params.task_kind = filter.task_kind
    if (filter?.wo_status) params.wo_status = filter.wo_status
    if (filter?.assigned_to) params.assigned_to = filter.assigned_to
    if (filter?.segment_id) params.segment_id = filter.segment_id
    if (filter?.commune_id?.length) params.commune_id = filter.commune_id
    if (filter?.page) params.page = filter.page

    const response = await apiClient.get<PagedResponse<WorkOrderItem>>('/work-orders', { params })
    return response.data
  },

  /**
   * Lấy chi tiết một lệnh công tác
   */
  async getWorkOrderDetail(id: string): Promise<WorkOrderDetail> {
    const response = await apiClient.get<WorkOrderDetail>(`/work-orders/${id}`)
    return response.data
  },

  /**
   * Lấy danh sách kỹ sư hiện trường theo địa bàn xã
   */
  async getAssignees(communeId: string, page = 1): Promise<PagedResponse<WorkOrderAssignee>> {
    const response = await apiClient.get<PagedResponse<WorkOrderAssignee>>('/work-orders/assignees', {
      params: { commune_id: communeId, page },
    })
    return response.data
  },

  /**
   * Quản lý tạo lệnh / lịch làm việc mới
   */
  async createWorkOrder(payload: CreateWorkOrderPayload): Promise<WorkOrderDetail> {
    const body: Record<string, any> = {
      task_kind: payload.taskKind,
      title: payload.title,
      segment_id: payload.segmentId,
      assigned_to: payload.assignedTo,
      scheduled_date: payload.scheduledDate,
      due_date: payload.dueDate,
      note: payload.note,
      fault_ids: payload.faultIds || [],
    }
    if (payload.communeId) body.commune_id = payload.communeId
    if (payload.materialsNote) body.materials_note = payload.materialsNote

    const response = await apiClient.post<WorkOrderDetail>('/work-orders', body)
    return response.data
  },

  /**
   * Cập nhật ngày hẹn, hạn chót hoặc tiêu đề
   */
  async patchWorkOrder(id: string, payload: PatchWorkOrderPayload): Promise<WorkOrderDetail> {
    const body: Record<string, any> = {}
    if (payload.title !== undefined) body.title = payload.title
    if (payload.scheduledDate !== undefined) body.scheduled_date = payload.scheduledDate
    if (payload.dueDate !== undefined) body.due_date = payload.dueDate
    if (payload.assignedTo !== undefined) body.assigned_to = payload.assignedTo
    if (payload.segmentId !== undefined) body.segment_id = payload.segmentId
    if (payload.taskKind !== undefined) body.task_kind = payload.taskKind

    const response = await apiClient.patch<WorkOrderDetail>(`/work-orders/${id}`, body)
    return response.data
  },

  /**
   * Gán / Đổi kỹ sư hiện trường phụ trách
   */
  async assignWorkOrder(id: string, payload: AssignWorkOrderPayload): Promise<WorkOrderDetail> {
    const response = await apiClient.put<WorkOrderDetail>(`/work-orders/${id}/assignee`, {
      assigned_to: payload.assignedTo,
    })
    return response.data
  },

  /**
   * Kỹ sư hiện trường bấm bắt đầu thực hiện (chuyển sang in_progress)
   */
  async startWorkOrder(id: string): Promise<WorkOrderDetail> {
    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/start`)
    return response.data
  },

  /**
   * Kỹ sư nộp báo cáo hiện trường kèm ghi chú vật tư (chuyển sang done)
   */
  async completeWorkOrder(id: string, payload: CompleteWorkOrderPayload): Promise<WorkOrderDetail> {
    const body: Record<string, any> = {
      report_note: payload.reportNote,
      fault_outcomes: payload.faultOutcomes || [],
    }
    if (payload.materialsNote) body.materials_note = payload.materialsNote

    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/complete`, body)
    return response.data
  },

  /**
   * Quản lý duyệt nghiệm thu
   */
  async verifyWorkOrder(id: string, payload: ReviewWorkOrderPayload): Promise<WorkOrderDetail> {
    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/verify`, {
      note: payload.note,
      materials_note: payload.materialsNote,
    })
    return response.data
  },

  /**
   * Quản lý trả về yêu cầu làm lại
   */
  async returnWorkOrder(id: string, payload: ReviewWorkOrderPayload): Promise<WorkOrderDetail> {
    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/return`, {
      note: payload.note,
    })
    return response.data
  },

  /**
   * Quản lý không duyệt / Hủy lệnh (Tự động END có lưu vết)
   */
  async cancelWorkOrder(id: string, payload: ReviewWorkOrderPayload): Promise<WorkOrderDetail> {
    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/cancel`, {
      note: payload.note,
    })
    return response.data
  },

  /**
   * Quản lý mở bước tiếp theo trong chuỗi hồ sơ (kế thừa case_id từ lệnh cha)
   */
  async followUpWorkOrder(
    id: string,
    payload: {
      taskKind: string
      title?: string
      faultIds?: string[]
      assignedTo?: string
      scheduledDate?: string
      dueDate?: string
      note?: string
      materialsNote?: string
    }
  ): Promise<WorkOrderDetail> {
    const body: Record<string, any> = {
      task_kind: payload.taskKind,
    }
    if (payload.title) body.title = payload.title
    if (payload.faultIds?.length) body.fault_ids = payload.faultIds
    if (payload.assignedTo) body.assigned_to = payload.assignedTo
    if (payload.scheduledDate) body.scheduled_date = payload.scheduledDate
    if (payload.dueDate) body.due_date = payload.dueDate
    if (payload.note) body.note = payload.note
    if (payload.materialsNote) body.materials_note = payload.materialsNote

    const response = await apiClient.post<WorkOrderDetail>(`/work-orders/${id}/follow-up`, body)
    return response.data
  },
}
