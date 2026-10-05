import mockPolesData from '../../data/mock-poles.geo.json'

export interface PoleItem {
  poleId: string
  segmentId: string
  fixtureType: string
  lampWatt: number
  atlas: string
  status: string
}

/**
 * Trích xuất mã tuyến đường từ chuỗi hiển thị, ví dụ:
 * "Tuyến A - Trục chính liên xã Phước Hậu (SEG-001)" -> "SEG-001"
 */
export function extractSegmentId(segmentStr: string): string {
  if (!segmentStr) return 'SEG-001'
  const match = segmentStr.match(/SEG-\d+/)
  if (match) return match[0]
  if (segmentStr.includes('Tuyến A')) return 'SEG-001'
  if (segmentStr.includes('Tuyến B')) return 'SEG-002'
  if (segmentStr.includes('Tuyến C')) return 'SEG-003'
  if (segmentStr.includes('Tuyến D')) return 'SEG-004'
  return 'SEG-001'
}

/**
 * Lấy danh sách cột đèn theo tuyến đường
 */
export function getPolesBySegment(segmentStr: string): PoleItem[] {
  const segmentId = extractSegmentId(segmentStr)
  
  const features = (mockPolesData as any)?.features || []
  const filtered = features
    .filter((f: any) => f?.properties?.segment_id === segmentId)
    .map((f: any) => ({
      poleId: f.properties.pole_id,
      segmentId: f.properties.segment_id,
      fixtureType: f.properties.fixture_type || 'led_road_lamp',
      lampWatt: f.properties.lamp_watt || 100,
      atlas: f.properties.atlas || `Vị trí cột dọc tuyến ${segmentId}`,
      status: f.properties.fixture_status || 'normal',
    }))

  // Nếu SEG-004 chưa có trong mock geojson, sinh danh sách mẫu 15 cột
  if (filtered.length === 0 && segmentId === 'SEG-004') {
    return Array.from({ length: 15 }, (_, i) => {
      const num = String(i + 1).padStart(4, '0')
      return {
        poleId: `POLE-01${num.substring(2)}`,
        segmentId: 'SEG-004',
        fixtureType: 'led_road_lamp',
        lampWatt: 100,
        atlas: `Cột đèn số ${i + 1} dọc bờ kênh ấp 4`,
        status: 'normal',
      }
    })
  }

  return filtered
}
