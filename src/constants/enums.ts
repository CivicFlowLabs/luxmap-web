/**
 * LuxMap System Enums (Khoá Cứng theo API Contract v1.1 & Backend C#)
 * Tham chiếu tài liệu: api-contract-v1.1.md Mục 1 & CivicFlow.Modules.Identity.Entities.UserRole
 */

/**
 * Vai trò người dùng (Khớp 100% Backend C# UserRole.cs & Swagger)
 */
export enum UserRole {
  CITIZEN = 0, // Người dân — chỉ thấy phản ánh của mình và dữ liệu công khai
  OFFICER = 1, // Cán bộ — thấy toàn bộ dữ liệu thuộc đơn vị hành chính của mình
  LEADER = 2,  // Lãnh đạo — xem số liệu tổng hợp, không sửa dữ liệu nghiệp vụ
  ADMIN = 3,   // Quản trị — toàn hệ thống
}

/**
 * Ánh xạ nhãn tiếng Việt và màu sắc cho các vai trò RBAC (chuỗi OpenAPI Swagger)
 */
export const USER_ROLE_LABELS: Record<string, string> = {
  system_admin: 'Quản trị hệ thống',
  manager: 'Cán bộ quản lý',
  superior: 'Lãnh đạo cấp trên',
  field_engineer: 'Kỹ sư hiện trường',
}

export const USER_ROLE_BADGES: Record<string, { label: string; colorClass: string }> = {
  system_admin: {
    label: 'Quản trị hệ thống',
    colorClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  manager: {
    label: 'Cán bộ quản lý',
    colorClass: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  superior: {
    label: 'Lãnh đạo cấp trên',
    colorClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  field_engineer: {
    label: 'Kỹ sư hiện trường',
    colorClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
}

export function getUserRoleBadge(role?: string | null) {
  if (!role) {
    return {
      label: 'Chưa phân vai trò',
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    }
  }
  return (
    USER_ROLE_BADGES[role] || {
      label: role,
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    }
  )
}

/**
 * Trạng thái bóng đèn chiếu sáng (Màu sắc trên GIS Map)
 */
export enum FixtureStatus {
  NORMAL = 'normal',   // Hoạt động bình thường
  DIM = 'dim',         // Sáng yếu / suy giảm quang thông (Giá trị cốt lõi đề tài)
  OUT = 'out',         // Mất sáng hoàn toàn
  UNKNOWN = 'unknown', // Sweep gần nhất không phủ được (bị che, ảnh hỏng, chưa quét)
}

/**
 * Nguồn cấp điện của cột đèn
 */
export enum PowerSource {
  GRID = 'grid',   // Lưới điện quốc gia
}

/**
 * Loại thiết bị chiếu sáng
 */
export enum FixtureType {
  LED_ROAD_LAMP = 'led_road_lamp',       // Đèn LED đường phố
}

/**
 * Phân loại sự cố kỹ thuật
 */
export enum FaultType {
  LAMP_OUT = 'lamp_out',               // Đèn tắt / mất sáng
  LAMP_DIM = 'lamp_dim',               // Đèn suy giảm quang thông / sáng yếu
  SEGMENT_OUTAGE = 'segment_outage',   // Sự cố mất điện cả tuyến đường
  NODE_OFFLINE = 'node_offline',       // Mất kết nối cảm biến IoT
  RUNTIME_DECLINE = 'runtime_decline', // Thời lượng phát sáng suy giảm (từ IoT)
}

/**
 * Trạng thái vòng đời của sự cố
 */
export enum FaultStatus {
  DETECTED = 'detected',       // Mới phát hiện (từ CV, IoT hoặc người dân báo)
  CONFIRMED = 'confirmed',     // Kỹ sư/Cán bộ đã duyệt xác nhận
  REJECTED = 'rejected',       // Bác bỏ (AI nhận diện nhầm)
  IN_PROGRESS = 'in_progress', // Đang trong quá trình sửa chữa
  RESOLVED = 'resolved',       // Đội bảo trì đã sửa chữa xong
  VERIFIED = 'verified',       // Kỹ sư/Lãnh đạo đã nghiệm thu chất lượng
}

/**
 * Mức độ nghiêm trọng của sự cố
 */
export enum Severity {
  LOW = 'low',           // Thấp
  MEDIUM = 'medium',     // Trung bình
  HIGH = 'high',         // Cao
  CRITICAL = 'critical', // Khẩn cấp (nguy hiểm an toàn giao thông)
}

/**
 * Kênh phát hiện sự cố
 */
export enum SourceChannel {
  CV = 'cv',                     // Thị giác máy tính (quét ban đêm)
  IOT = 'iot',                   // Cảm biến đo sáng / vi điều khiển IoT
  FIELD_REPORT = 'field_report', // Báo cáo hiện trường / phản ánh người dân
}

/**
 * Nguồn gốc dữ liệu thu thập
 */
export enum DataSource {
  FIELD = 'field',                     // Đo đạc thực địa
  PUBLIC_IMAGERY = 'public_imagery',   // Ảnh vệ tinh / ảnh công cộng
  CALIBRATION_RIG = 'calibration_rig', // Dữ liệu từ thiết bị hiệu chuẩn
  SIMULATED = 'simulated',             // Dữ liệu mô phỏng
}

/**
 * Nhãn hiển thị tiếng Việt thân thiện cho nguồn dữ liệu
 */
export const DATA_SOURCE_LABELS: Record<string, string> = {
  field: 'Khảo sát thực địa',
  public_imagery: 'Ảnh vệ tinh / Bản đồ số',
  calibration_rig: 'Thiết bị đo chuẩn',
  simulated: 'Dữ liệu mô phỏng',
}

/**
 * Lấy nhãn tiếng Việt tương ứng cho nguồn dữ liệu
 */
export function getDataSourceDisplayName(source?: string | null): string {
  if (!source) return 'Khảo sát thực địa'
  return DATA_SOURCE_LABELS[source] || source
}

/**
 * Trạng thái Lệnh sửa chữa / Phiếu bảo trì (Work Order)
 */
export enum WorkOrderStatus {
  OPEN = 'open',               // Mới tạo / Chờ phân công
  ASSIGNED = 'assigned',       // Đã giao cho Đội thi công
  IN_PROGRESS = 'in_progress', // Đang tiến hành sửa chữa ngoài hiện trường
  DONE = 'done',               // Đội thi công báo cáo đã hoàn tất
  VERIFIED = 'verified',       // Kỹ sư đã nghiệm thu hiện trường
  CANCELLED = 'cancelled',     // Huỷ bỏ lệnh
}

/**
 * Vai trò của Node cảm biến IoT
 */
export enum NodeRole {
  SEGMENT_CONTROLLER = 'segment_controller', // Bộ điều khiển tuyến đường
  SAMPLED_FIXTURE = 'sampled_fixture',       // Cảm biến lấy mẫu trên từng bóng
}

/**
 * Trạng thái kết nối của Node cảm biến IoT
 */
export enum NodeStatus {
  ONLINE = 'online',                 // Đang kết nối
  OFFLINE = 'offline',               // Mất kết nối
  NEVER_REPORTED = 'never_reported', // Chưa từng gửi dữ liệu
}

/**
 * Phân cấp tuyến đường giao thông nông thôn
 */
export enum RoadClass {
  INTER_COMMUNE = 'inter_commune', // Đường liên xã
  INTER_VILLAGE = 'inter_village', // Đường liên thôn / xóm
}
