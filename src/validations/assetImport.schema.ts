import { z } from 'zod'
import type { RoadClass, DataSource, FixtureType, PowerSource } from '../types/common/enums'
import type { PoleListItem } from '../types/assets/poles'
import type { FeederListItem } from '../types/assets/feeders'
import type { SegmentListItem } from '../types/assets/segments'
import type { ManagedFixture } from '../hooks/assets/useAssetData'
import { formatCommuneDisplayName } from '../constants/communes'

/**
 * Interface cho các trường thay đổi khi so khớp bản ghi
 */
export interface FieldDiff {
  label: string
  oldVal: string
  newVal: string
}

/**
 * Interface đối tượng sau khi parse và validate xong để hiển thị trên Preview Table
 */
export interface ParsedItemReview {
  externalRef: string
  actionType: 'new' | 'updated' | 'unchanged' | 'invalid'
  errorMsg?: string
  segmentId: string
  segmentName: string
  cabinetId: string
  cabinetName: string
  lat: number
  lng: number
  lampWatt: number
  powerSource: string
  fixtureType: string
  warrantyExpiry: string
  nearSensitivePoi: boolean
  diffs: FieldDiff[]
  // Thông tin mở rộng theo từng loại danh mục
  roadClass?: RoadClass
  lengthM?: number
  communeId?: string
  feederName?: string
  note?: string
}

/**
 * Ngữ cảnh dữ liệu GIS đang có trong hệ thống để đối soát ràng buộc quan hệ
 */
export interface ValidationContext {
  poles: PoleListItem[]
  fixtures: ManagedFixture[]
  cabinets: FeederListItem[]
  segments: SegmentListItem[]
}

// ==========================================
// 1. ZOD SCHEMAS FOR INDIVIDUAL CSV FORMATS
// ==========================================

export const segmentImportSchema = z.object({
  external_ref: z.string().min(1, 'Mã tuyến đường (external_ref) không được để trống'),
  commune_id: z.string().min(1, 'Mã xã/phường (commune_id) không được để trống'),
  segment_name: z.string().min(1, 'Tên tuyến đường (segment_name) không được để trống'),
  road_class: z.enum(['inter_commune', 'inter_village'] as const satisfies readonly [RoadClass, ...RoadClass[]], {
    message: 'Cấp đường (road_class) phải là inter_commune hoặc inter_village',
  }),
  length_m: z.coerce.number().positive('Chiều dài tuyến đường (length_m) phải lớn hơn 0'),
  data_source: z
    .enum(['field', 'public_imagery', 'calibration_rig', 'simulated'] as const satisfies readonly [
      DataSource,
      ...DataSource[],
    ])
    .default('field'),
  geom_wkt: z.string().refine((val) => /^LINESTRING\s*\(/i.test(val.trim()), {
    message: 'Tọa độ tuyến đường phải là định dạng LINESTRING WKT hợp lệ',
  }),
})
export type SegmentImportInput = z.infer<typeof segmentImportSchema>

export const feederImportSchema = z.object({
  external_ref: z.string().min(1, 'Mã tủ điện/lộ nguồn (external_ref) không được để trống'),
  commune_id: z.string().min(1, 'Mã xã/phường (commune_id) không được để trống'),
  feeder_name: z.string().min(1, 'Tên tủ điện/lộ nguồn (feeder_name) không được để trống'),
  geom_wkt: z
    .string()
    .refine((val) => !val || val.trim() === '' || /^LINESTRING\s*\(/i.test(val.trim()), {
      message: 'Tọa độ lộ nguồn/tủ điện phải là định dạng LINESTRING WKT hợp lệ (Ví dụ: LINESTRING(lng1 lat1, lng2 lat2))',
    })
    .optional()
    .nullable(),
})
export type FeederImportInput = z.infer<typeof feederImportSchema>

export const poleImportSchema = z.object({
  external_ref: z.string().min(1, 'Mã cột điện (external_ref) không được để trống'),
  commune_id: z.string().min(1, 'Mã xã/phường (commune_id) không được để trống'),
  segment_external_ref: z.string().min(1, 'Mã tuyến đường liên kết (segment_external_ref) không được để trống'),
  feeder_external_ref: z.string().optional().nullable(),
  geom_wkt: z.string().refine((val) => /^POINT\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*\)/i.test(val.trim()), {
    message: 'Tọa độ cột điện phải là POINT(lng lat) WKT hợp lệ',
  }),
  near_sensitive_poi: z.preprocess((val) => {
    if (typeof val === 'string') return val.toLowerCase() === 'true'
    return Boolean(val)
  }, z.boolean()).default(false),
  data_source: z
    .enum(['field', 'public_imagery', 'calibration_rig', 'simulated'] as const satisfies readonly [
      DataSource,
      ...DataSource[],
    ])
    .default('field'),
  fixture_type: z
    .enum(['led_road_lamp'] as const satisfies readonly [FixtureType, ...FixtureType[]])
    .optional(),
  power_source: z
    .enum(['grid'] as const satisfies readonly [PowerSource, ...PowerSource[]])
    .optional(),
  lamp_watt: z.coerce.number().positive().optional(),
  warranty_expiry: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().optional().nullable()
  ),
  note: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional().nullable()
  ),
})
export type PoleImportInput = z.infer<typeof poleImportSchema>

export const fixtureImportSchema = z.object({
  pole_external_ref: z.string().min(1, 'Mã cột điện (pole_external_ref) không được để trống'),
  fixture_type: z
    .enum(['led_road_lamp'] as const satisfies readonly [FixtureType, ...FixtureType[]])
    .default('led_road_lamp'),
  power_source: z
    .enum(['grid'] as const satisfies readonly [PowerSource, ...PowerSource[]])
    .default('grid'),
  lamp_watt: z.coerce.number().positive('Công suất đèn (lamp_watt) phải lớn hơn 0'),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày lắp đặt phải theo định dạng YYYY-MM-DD'),
  removed_date: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày tháo dỡ phải theo định dạng YYYY-MM-DD')
      .optional()
      .nullable()
  ),
  warranty_expiry: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Hạn bảo hành phải theo định dạng YYYY-MM-DD')
      .optional()
      .nullable()
  ),
  data_source: z
    .enum(['field', 'public_imagery', 'calibration_rig', 'simulated'] as const satisfies readonly [
      DataSource,
      ...DataSource[],
    ])
    .default('field'),
})
export type FixtureImportInput = z.infer<typeof fixtureImportSchema>

// ==========================================
// 2. HELPER COORDINATE PARSERS
// ==========================================

function extractPointCoords(wkt: string | null | undefined, defaultLat = 10.970187, defaultLng = 106.489639) {
  if (!wkt) return { lat: defaultLat, lng: defaultLng }
  const match = wkt.match(/POINT\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*\)/i)
  if (match) {
    return {
      lng: parseFloat(match[1]) || defaultLng,
      lat: parseFloat(match[2]) || defaultLat,
    }
  }
  return { lat: defaultLat, lng: defaultLng }
}

function extractLineFirstPointCoords(wkt: string | null | undefined, defaultLat = 10.970187, defaultLng = 106.489639) {
  if (!wkt) return { lat: defaultLat, lng: defaultLng }
  const match = wkt.match(/LINESTRING\s*\(\s*([0-9.-]+)\s+([0-9.-]+)/i)
  if (match) {
    return {
      lng: parseFloat(match[1]) || defaultLng,
      lat: parseFloat(match[2]) || defaultLat,
    }
  }
  return { lat: defaultLat, lng: defaultLng }
}

// ==========================================
// 3. MASTER VALIDATOR & CONSTRAINT CHECKER
// ==========================================

/**
 * Validate một dòng dữ liệu CSV tùy theo category, kiểm tra Schema + Ràng buộc quan hệ GIS
 */
export function validateImportRow(
  category: 'segments' | 'cabinets' | 'poles' | 'fixtures' | 'poles_and_fixtures',
  rowObj: Record<string, string>,
  context: ValidationContext,
  rowIndex: number
): ParsedItemReview {
  const { segments, cabinets, poles } = context

  // ----------------------------------------------------
  // CASE A: SEGMENTS (Tuyến đường chiếu sáng) - ROOT ENTITY
  // Không có ràng buộc phụ thuộc cha!
  // ----------------------------------------------------
  if (category === 'segments') {
    const parseResult = segmentImportSchema.safeParse(rowObj)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Lỗi định dạng dữ liệu tuyến đường'
      return {
        externalRef: rowObj.external_ref || `SEG-ROW-${rowIndex + 1}`,
        actionType: 'invalid',
        errorMsg: firstError,
        segmentId: rowObj.external_ref || '',
        segmentName: rowObj.segment_name || 'Không xác định',
        cabinetId: '',
        cabinetName: '',
        lat: 10.970187,
        lng: 106.489639,
        lampWatt: 0,
        powerSource: 'grid',
        fixtureType: 'led_road_lamp',
        warrantyExpiry: '',
        nearSensitivePoi: false,
        diffs: [],
      }
    }

    const data = parseResult.data
    const { lat, lng } = extractLineFirstPointCoords(data.geom_wkt)

    // So khớp xem tuyến đường đã tồn tại trong GIS chưa (Chỉ tìm duy nhất theo external_ref chuẩn Backend)
    const existing = segments.find(
      (s) => s.external_ref && s.external_ref.toLowerCase() === data.external_ref.toLowerCase()
    )

    let actionType: 'new' | 'updated' | 'unchanged' = 'new'
    const diffs: FieldDiff[] = []

    if (!existing) {
      actionType = 'new'
      diffs.push({
        label: 'Tuyến đường mới',
        oldVal: 'Chưa có trên GIS',
        newVal: `${data.segment_name} (${data.length_m}m)`,
      })
    } else {
      if (existing.segment_name !== data.segment_name) {
        diffs.push({
          label: 'Tên tuyến đường',
          oldVal: existing.segment_name || 'Chưa đặt tên',
          newVal: data.segment_name,
        })
      }
      if (existing.road_class !== data.road_class) {
        diffs.push({
          label: 'Cấp đường',
          oldVal: existing.road_class === 'inter_commune' ? 'Đường liên xã' : 'Đường liên thôn',
          newVal: data.road_class === 'inter_commune' ? 'Đường liên xã' : 'Đường liên thôn',
        })
      }
      if (existing.length_m !== data.length_m) {
        diffs.push({
          label: 'Chiều dài',
          oldVal: `${existing.length_m}m`,
          newVal: `${data.length_m}m`,
        })
      }
      if (data.commune_id && existing.commune_id !== data.commune_id) {
        diffs.push({
          label: 'Xã/phường',
          oldVal: formatCommuneDisplayName(existing.commune_id),
          newVal: formatCommuneDisplayName(data.commune_id),
        })
      }

      actionType = diffs.length > 0 ? 'updated' : 'unchanged'
    }

    return {
      externalRef: data.external_ref,
      actionType,
      segmentId: existing?.segment_id || data.external_ref,
      segmentName: data.segment_name,
      cabinetId: '',
      cabinetName: '',
      lat,
      lng,
      lampWatt: 0,
      powerSource: 'grid',
      fixtureType: 'led_road_lamp',
      warrantyExpiry: '',
      nearSensitivePoi: false,
      diffs,
      roadClass: data.road_class,
      lengthM: data.length_m,
      communeId: data.commune_id,
    }
  }

  // ----------------------------------------------------
  // CASE B: CABINETS (Tủ điện / Lộ nguồn) - ROOT ENTITY
  // Không có ràng buộc phụ thuộc cha!
  // ----------------------------------------------------
  if (category === 'cabinets') {
    const parseResult = feederImportSchema.safeParse(rowObj)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Lỗi định dạng dữ liệu tủ điện'
      return {
        externalRef: rowObj.external_ref || `CAB-ROW-${rowIndex + 1}`,
        actionType: 'invalid',
        errorMsg: firstError,
        segmentId: '',
        segmentName: '',
        cabinetId: rowObj.external_ref || '',
        cabinetName: rowObj.feeder_name || 'Không xác định',
        lat: 10.970187,
        lng: 106.489639,
        lampWatt: 0,
        powerSource: 'grid',
        fixtureType: 'led_road_lamp',
        warrantyExpiry: '',
        nearSensitivePoi: false,
        diffs: [],
      }
    }

    const data = parseResult.data
    const { lat, lng } = extractLineFirstPointCoords(data.geom_wkt)

    // So khớp xem tủ đã tồn tại trong GIS chưa (Chỉ tìm duy nhất theo external_ref chuẩn Backend)
    const existing = cabinets.find(
      (c) => c.external_ref && c.external_ref.toLowerCase() === data.external_ref.toLowerCase()
    )

    let actionType: 'new' | 'updated' | 'unchanged' = 'new'
    const diffs: FieldDiff[] = []

    if (!existing) {
      actionType = 'new'
      diffs.push({
        label: 'Tủ điện mới',
        oldVal: 'Chưa có trên GIS',
        newVal: `${data.feeder_name} (${formatCommuneDisplayName(data.commune_id)})`,
      })
    } else {
      if (existing.feeder_name !== data.feeder_name) {
        diffs.push({
          label: 'Tên tủ điện',
          oldVal: existing.feeder_name || 'Chưa đặt tên',
          newVal: data.feeder_name,
        })
      }
      if (data.commune_id && existing.commune_id !== data.commune_id) {
        diffs.push({
          label: 'Xã/phường',
          oldVal: formatCommuneDisplayName(existing.commune_id),
          newVal: formatCommuneDisplayName(data.commune_id),
        })
      }
      if (!existing.has_geometry && data.geom_wkt) {
        diffs.push({
          label: 'Tọa độ GIS',
          oldVal: 'Chưa định vị',
          newVal: `Định vị tọa độ (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        })
      }

      actionType = diffs.length > 0 ? 'updated' : 'unchanged'
    }

    return {
      externalRef: data.external_ref,
      actionType,
      segmentId: '',
      segmentName: '',
      cabinetId: existing?.feeder_id || data.external_ref,
      cabinetName: data.feeder_name,
      lat,
      lng,
      lampWatt: 0,
      powerSource: 'grid',
      fixtureType: 'led_road_lamp',
      warrantyExpiry: '',
      nearSensitivePoi: false,
      diffs,
      feederName: data.feeder_name,
      communeId: data.commune_id,
    }
  }

  // ----------------------------------------------------
  // CASE C: FIXTURES (Bóng đèn)
  // Ràng buộc bắt buộc: Cột điện (pole_external_ref) phải có trên GIS!
  // ----------------------------------------------------
  if (category === 'fixtures') {
    const parseResult = fixtureImportSchema.safeParse(rowObj)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Lỗi định dạng dữ liệu bóng đèn'
      const poleRef = rowObj.pole_external_ref
      const pPole = poleRef
        ? poles.find((p) => p.external_ref && p.external_ref.toLowerCase() === poleRef.toLowerCase())
        : undefined
      const segOfPole = pPole
        ? segments.find(
            (s) =>
              (pPole.segment_id && s.segment_id === pPole.segment_id) ||
              (pPole.segment_id && s.external_ref && s.external_ref.toLowerCase() === pPole.segment_id.toLowerCase())
          )
        : undefined
      return {
        externalRef: poleRef || `FIX-ROW-${rowIndex + 1}`,
        actionType: 'invalid',
        errorMsg: firstError,
        segmentId: pPole?.segment_id || '',
        segmentName: segOfPole?.segment_name || (poleRef ? `Cột ${poleRef}` : 'Lỗi định dạng'),
        cabinetId: pPole?.feeder_id || '',
        cabinetName: pPole?.feeder_id ? `Tủ ${pPole.feeder_id}` : '',
        lat: pPole?.location?.lat || 10.970187,
        lng: pPole?.location?.lng || 106.489639,
        lampWatt: parseInt(rowObj.lamp_watt, 10) || 100,
        powerSource: rowObj.power_source || 'grid',
        fixtureType: 'led_road_lamp',
        warrantyExpiry: rowObj.warranty_expiry || '',
        nearSensitivePoi: false,
        diffs: [],
      }
    }

    const data = parseResult.data
    const poleRef = data.pole_external_ref

    // Ràng buộc cha: Tìm Cột trong hệ thống GIS theo pole_external_ref
    const parentPole = poles.find(
      (p) => p.external_ref && p.external_ref.toLowerCase() === poleRef.toLowerCase()
    )

    if (!parentPole) {
      return {
        externalRef: poleRef,
        actionType: 'invalid',
        errorMsg: `Cột điện [${poleRef}] chưa có trong hệ thống GIS. Cần có Cột điện trước khi nạp Bóng!`,
        segmentId: '',
        segmentName: `Cột ${poleRef} (Chưa có trên GIS)`,
        cabinetId: '',
        cabinetName: '',
        lat: 10.970187,
        lng: 106.489639,
        lampWatt: data.lamp_watt,
        powerSource: data.power_source,
        fixtureType: data.fixture_type,
        warrantyExpiry: data.warranty_expiry || '',
        nearSensitivePoi: false,
        diffs: [],
      }
    }

    // Đã có cột điện hợp lệ -> Kiểm tra xem cột đó đã có bóng đèn chưa
    const existingFixture = parentPole.active_fixture

    let actionType: 'new' | 'updated' | 'unchanged' = 'new'
    const diffs: FieldDiff[] = []

    if (!existingFixture) {
      actionType = 'new'
      diffs.push({
        label: 'Lắp mới',
        oldVal: 'Chưa có bóng',
        newVal: `Đèn LED ${data.lamp_watt}W`,
      })
    } else {
      if (existingFixture.lamp_watt !== data.lamp_watt) {
        diffs.push({
          label: 'Công suất đèn',
          oldVal: `${existingFixture.lamp_watt}W`,
          newVal: `${data.lamp_watt}W`,
        })
      }
      if (data.warranty_expiry && existingFixture.warranty_expiry !== data.warranty_expiry) {
        diffs.push({
          label: 'Hạn bảo hành',
          oldVal: existingFixture.warranty_expiry || 'Chưa thiết lập',
          newVal: data.warranty_expiry,
        })
      }
      if (existingFixture.power_source !== data.power_source) {
        diffs.push({
          label: 'Nguồn điện',
          oldVal: existingFixture.power_source === 'grid' ? 'Lưới điện' : 'Năng lượng MT',
          newVal: data.power_source === 'grid' ? 'Lưới điện' : 'Năng lượng MT',
        })
      }
      if (data.fixture_type && existingFixture.fixture_type !== data.fixture_type) {
        diffs.push({
          label: 'Loại bóng đèn',
          oldVal: existingFixture.fixture_type || 'Chưa phân loại',
          newVal: data.fixture_type,
        })
      }

      actionType = diffs.length > 0 ? 'updated' : 'unchanged'
    }

    // Lấy thông tin Tuyến đường và Tủ nguồn mà Cột cha đang trực thuộc
    const segOfPole = segments.find(
      (s) =>
        (parentPole.segment_id && s.segment_id === parentPole.segment_id) ||
        (parentPole.segment_id && s.external_ref && s.external_ref.toLowerCase() === parentPole.segment_id.toLowerCase())
    )
    const cabOfPole = cabinets.find(
      (c) =>
        (parentPole.feeder_id && c.feeder_id === parentPole.feeder_id) ||
        (parentPole.feeder_id && c.external_ref && c.external_ref.toLowerCase() === parentPole.feeder_id.toLowerCase())
    )
    const segName = segOfPole?.segment_name || (parentPole.segment_id ? `Tuyến ${parentPole.segment_id}` : 'Chưa gán tuyến')
    const cabName = cabOfPole?.feeder_name || (parentPole.feeder_id ? `Tủ ${parentPole.feeder_id}` : '')

    return {
      externalRef: poleRef,
      actionType,
      segmentId: parentPole.segment_id || '',
      segmentName: segName,
      cabinetId: parentPole.feeder_id || '',
      cabinetName: cabName,
      lat: parentPole.location?.lat || 10.970187,
      lng: parentPole.location?.lng || 106.489639,
      lampWatt: data.lamp_watt,
      powerSource: data.power_source,
      fixtureType: data.fixture_type,
      warrantyExpiry: data.warranty_expiry || '',
      nearSensitivePoi: false,
      diffs,
    }
  }

  // ----------------------------------------------------
  // CASE D: POLES & POLES_AND_FIXTURES (Cột điện & Cột gắn bóng)
  // Ràng buộc:
  // 1. Tuyến đường (segment_external_ref) PHẢI tồn tại trong GIS
  // 2. Tủ điện (feeder_external_ref) nếu có nhập PHẢI tồn tại trong GIS
  // ----------------------------------------------------
  const parseResult = poleImportSchema.safeParse(rowObj)
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message || 'Lỗi định dạng dữ liệu cột điện'
    return {
      externalRef: rowObj.external_ref || `POLE-ROW-${rowIndex + 1}`,
      actionType: 'invalid',
      errorMsg: firstError,
      segmentId: rowObj.segment_external_ref || '',
      segmentName: 'Không xác định',
      cabinetId: rowObj.feeder_external_ref || '',
      cabinetName: '',
      lat: 10.970187,
      lng: 106.489639,
      lampWatt: parseInt(rowObj.lamp_watt, 10) || 100,
      powerSource: rowObj.power_source || 'grid',
      fixtureType: 'led_road_lamp',
      warrantyExpiry: rowObj.warranty_expiry || '',
      nearSensitivePoi: false,
      diffs: [],
    }
  }

  const data = parseResult.data
  const { lat, lng } = extractPointCoords(data.geom_wkt)

  // 1. Kiểm tra ràng buộc Tuyến đường theo segment_external_ref
  const segObj = segments.find(
    (s) => s.external_ref && s.external_ref.toLowerCase() === data.segment_external_ref.toLowerCase()
  )

  if (!segObj) {
    return {
      externalRef: data.external_ref,
      actionType: 'invalid',
      errorMsg: `Tuyến đường [${data.segment_external_ref}] chưa có trong hệ thống GIS. Cần có Tuyến đường trước khi nạp Cột!`,
      segmentId: data.segment_external_ref,
      segmentName: `Tuyến ${data.segment_external_ref} (Không tồn tại)`,
      cabinetId: data.feeder_external_ref || '',
      cabinetName: '',
      lat,
      lng,
      lampWatt: data.lamp_watt || 100,
      powerSource: data.power_source || 'grid',
      fixtureType: data.fixture_type || 'led_road_lamp',
      warrantyExpiry: data.warranty_expiry || '',
      nearSensitivePoi: data.near_sensitive_poi,
      diffs: [],
    }
  }

  // 2. Kiểm tra ràng buộc Tủ điện (nếu có cung cấp) theo feeder_external_ref
  let cabObj: FeederListItem | undefined = undefined
  if (data.feeder_external_ref) {
    cabObj = cabinets.find(
      (c) => c.external_ref && c.external_ref.toLowerCase() === data.feeder_external_ref!.toLowerCase()
    )
    if (!cabObj) {
      return {
        externalRef: data.external_ref,
        actionType: 'invalid',
        errorMsg: `Tủ điện / Lộ nguồn [${data.feeder_external_ref}] chưa có trong hệ thống GIS. Cần có Tủ điện trước khi nạp Cột!`,
        segmentId: segObj.segment_id || data.segment_external_ref,
        segmentName: segObj.segment_name || data.segment_external_ref,
        cabinetId: data.feeder_external_ref,
        cabinetName: `Tủ ${data.feeder_external_ref} (Không tồn tại)`,
        lat,
        lng,
        lampWatt: data.lamp_watt || 100,
        powerSource: data.power_source || 'grid',
        fixtureType: data.fixture_type || 'led_road_lamp',
        warrantyExpiry: data.warranty_expiry || '',
        nearSensitivePoi: data.near_sensitive_poi,
        diffs: [],
      }
    }
  }

  // Ràng buộc cha đã thỏa mãn -> Kiểm tra cột đã có trên GIS chưa theo external_ref
  const existingPole = poles.find(
    (p) => p.external_ref && p.external_ref.toLowerCase() === data.external_ref.toLowerCase()
  )

  const segName = segObj.segment_name || data.segment_external_ref
  const cabName = cabObj ? cabObj.feeder_name || `Tủ ${cabObj.feeder_id}` : ''
  const watt = data.lamp_watt || existingPole?.active_fixture?.lamp_watt || 100
  const powerSource = data.power_source || existingPole?.active_fixture?.power_source || 'grid'
  const fixtureType = data.fixture_type || existingPole?.active_fixture?.fixture_type || 'led_road_lamp'
  const warrantyExpiry = data.warranty_expiry || existingPole?.active_fixture?.warranty_expiry || '2026-12-31'

  let actionType: 'new' | 'updated' | 'unchanged' = 'new'
  const diffs: FieldDiff[] = []

  if (!existingPole) {
    actionType = 'new'
    diffs.push({
      label: 'Đăng ký mới',
      oldVal: 'Chưa có trên GIS',
      newVal: `Tạo mới (${watt}W, ${segName})`,
    })
  } else {
    // 1. So sánh Tọa độ GIS
    if (existingPole.location) {
      const latDiff = Math.abs(existingPole.location.lat - lat)
      const lngDiff = Math.abs(existingPole.location.lng - lng)
      if (latDiff > 0.00001 || lngDiff > 0.00001) {
        diffs.push({
          label: 'Tọa độ GIS',
          oldVal: `${existingPole.location.lat.toFixed(5)}, ${existingPole.location.lng.toFixed(5)}`,
          newVal: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        })
      }
    }

    // 2. So sánh Tuyến đường quản lý
    if (existingPole.segment_id && segObj.segment_id && existingPole.segment_id !== segObj.segment_id) {
      const oldSeg = segments.find((s) => s.segment_id === existingPole.segment_id)
      diffs.push({
        label: 'Tuyến đường quản lý',
        oldVal: oldSeg?.segment_name || existingPole.segment_id,
        newVal: segObj.segment_name || data.segment_external_ref,
      })
    }

    // 3. So sánh Tủ điện nguồn
    const currentFeederId = existingPole.feeder_id || null
    const newFeederId = cabObj?.feeder_id || null
    if (data.feeder_external_ref && currentFeederId !== newFeederId) {
      const oldCab = cabinets.find((c) => c.feeder_id === currentFeederId)
      diffs.push({
        label: 'Tủ điện nguồn',
        oldVal: oldCab?.feeder_name || (currentFeederId ? `Tủ ${currentFeederId}` : 'Chưa gán tủ'),
        newVal: cabObj?.feeder_name || `Tủ ${data.feeder_external_ref}`,
      })
    }

    // 4. So sánh Công suất đèn
    if (data.lamp_watt && existingPole.active_fixture?.lamp_watt !== data.lamp_watt) {
      diffs.push({
        label: 'Công suất đèn',
        oldVal: `${existingPole.active_fixture?.lamp_watt ?? 100}W`,
        newVal: `${data.lamp_watt}W`,
      })
    }

    // 5. So sánh Nguồn điện
    if (data.power_source && existingPole.active_fixture?.power_source !== data.power_source) {
      diffs.push({
        label: 'Nguồn điện',
        oldVal: existingPole.active_fixture?.power_source === 'grid' ? 'Lưới điện' : 'Năng lượng MT',
        newVal: data.power_source === 'grid' ? 'Lưới điện' : 'Năng lượng MT',
      })
    }

    // 6. So sánh Loại bóng đèn
    if (data.fixture_type && existingPole.active_fixture?.fixture_type !== data.fixture_type) {
      diffs.push({
        label: 'Loại bóng đèn',
        oldVal: existingPole.active_fixture?.fixture_type || 'Chưa phân loại',
        newVal: data.fixture_type,
      })
    }

    // 7. So sánh Hạn bảo hành
    if (data.warranty_expiry && existingPole.active_fixture?.warranty_expiry !== data.warranty_expiry) {
      diffs.push({
        label: 'Hạn bảo hành',
        oldVal: existingPole.active_fixture?.warranty_expiry || 'Chưa thiết lập',
        newVal: data.warranty_expiry,
      })
    }

    // 8. So sánh Khu vực nhạy cảm (POI)
    if (data.near_sensitive_poi !== undefined && existingPole.near_sensitive_poi !== data.near_sensitive_poi) {
      diffs.push({
        label: 'Khu vực nhạy cảm (POI)',
        oldVal: existingPole.near_sensitive_poi ? 'Gần khu nhạy cảm' : 'Bình thường',
        newVal: data.near_sensitive_poi ? 'Gần khu nhạy cảm' : 'Bình thường',
      })
    }

    // 9. So sánh Ghi chú hiện trường
    const incomingNote = data.note !== undefined ? data.note?.trim() || null : null
    const currentNote = existingPole.note?.trim() || null
    if (incomingNote !== null && incomingNote !== currentNote) {
      diffs.push({
        label: 'Ghi chú',
        oldVal: currentNote || 'Chưa có ghi chú',
        newVal: incomingNote,
      })
    }

    actionType = diffs.length > 0 ? 'updated' : 'unchanged'
  }

  return {
    externalRef: data.external_ref,
    actionType,
    segmentId: segObj.segment_id || data.segment_external_ref,
    segmentName: segName,
    cabinetId: cabObj?.feeder_id || data.feeder_external_ref || '',
    cabinetName: cabName,
    lat,
    lng,
    lampWatt: watt,
    powerSource,
    fixtureType,
    warrantyExpiry,
    nearSensitivePoi: data.near_sensitive_poi,
    note: data.note || existingPole?.note || undefined,
    diffs,
  }
}
