import React, { useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Route, X, CheckCircle2, MapPin, RotateCcw } from 'lucide-react'
import { SegmentRouteMap } from '../../../components/SegmentRouteMap'
import { calculateRouteLengthMeters } from '../../../utils/gis-map/routeUtils'
import type { AssetSegmentItem } from '../AssetManagementPage'
import mockPolesGeoJson from '../../../data/mock-poles.geo.json'

export interface EditSegmentModalProps {
  isOpen: boolean
  segment: AssetSegmentItem | null
  onClose: () => void
  onSave: (updated: AssetSegmentItem) => void
}

interface EditSegmentModalContentProps {
  segment: AssetSegmentItem
  onClose: () => void
  onSave: (updated: AssetSegmentItem) => void
}

const EditSegmentModalContent: React.FC<EditSegmentModalContentProps> = ({
  segment,
  onClose,
  onSave,
}) => {
  const initialStart: [number, number] =
    segment.start_coord && segment.start_coord[0] > 50
      ? segment.start_coord
      : segment.coordinates && segment.coordinates.length > 0
      ? segment.coordinates[0]
      : [108.973, 11.581]

  const initialEnd: [number, number] =
    segment.end_coord && segment.end_coord[0] > 50
      ? segment.end_coord
      : segment.coordinates && segment.coordinates.length > 0
      ? segment.coordinates[segment.coordinates.length - 1]
      : [108.978, 11.585]

  const initialCoords: [number, number][] =
    segment.coordinates && segment.coordinates.length > 0
      ? segment.coordinates
      : [initialStart, initialEnd]

  const [segmentName, setSegmentName] = useState(segment.segment_name || '')
  const [roadClass, setRoadClass] = useState<'inter_commune' | 'inter_village' | 'alley'>(
    segment.road_class || 'inter_commune'
  )
  const [lengthM, setLengthM] = useState<number>(segment.length_m || 1000)
  const [communeName, setCommuneName] = useState(segment.commune_name || 'Xã Phước Hậu')
  const [hasActiveFault, setHasActiveFault] = useState<boolean>(!!segment.has_active_fault)

  // Coordinate States initialized with valid values immediately
  const [startLat, setStartLat] = useState<number>(initialStart[1])
  const [startLng, setStartLng] = useState<number>(initialStart[0])
  const [endLat, setEndLat] = useState<number>(initialEnd[1])
  const [endLng, setEndLng] = useState<number>(initialEnd[0])
  const [routeCoords, setRouteCoords] = useState<[number, number][]>(initialCoords)

  const originalStartRef = useRef<[number, number]>(initialStart)
  const originalEndRef = useRef<[number, number]>(initialEnd)
  const originalRouteCoordsRef = useRef<[number, number][]>([...initialCoords])

  // Filter existing poles that belong to this segment
  const segmentPoles = useMemo(() => {
    const features = (mockPolesGeoJson as any).features || []
    return features
      .filter((f: any) => f.properties?.segment_id === segment.segment_id)
      .map((f: any) => ({
        id: f.properties?.pole_id,
        code: f.properties?.pole_id,
        coord: f.geometry?.coordinates as [number, number],
        status: f.properties?.fixture_status,
        atlas: f.properties?.atlas,
      }))
      .filter((p: any) => p.coord && p.coord.length === 2)
  }, [segment.segment_id])

  // Start coordinate handlers
  const handleStartCoordChange = useCallback((coord: [number, number]) => {
    setStartLng(coord[0])
    setStartLat(coord[1])
  }, [])

  const handleStartLatChange = (val: number) => {
    setStartLat(val)
  }

  const handleStartLngChange = (val: number) => {
    setStartLng(val)
  }

  // End coordinate handlers
  const handleEndCoordChange = useCallback((coord: [number, number]) => {
    setEndLng(coord[0])
    setEndLat(coord[1])
  }, [])

  const handleEndLatChange = (val: number) => {
    setEndLat(val)
  }

  const handleEndLngChange = (val: number) => {
    setEndLng(val)
  }

  // Handle full route geometry changes from routing/trimming
  const handleRouteCoordsChange = useCallback((coords: [number, number][]) => {
    setRouteCoords(coords)
    const newLen = calculateRouteLengthMeters(coords)
    if (newLen > 0) {
      setLengthM(newLen)
    }
  }, [])

  // Reset to original handlers
  const handleResetStart = () => {
    if (originalStartRef.current) {
      handleStartCoordChange(originalStartRef.current)
      if (endLng === originalEndRef.current[0] && endLat === originalEndRef.current[1]) {
        handleRouteCoordsChange([...originalRouteCoordsRef.current])
      }
    }
  }

  const handleResetEnd = () => {
    if (originalEndRef.current) {
      handleEndCoordChange(originalEndRef.current)
      if (startLng === originalStartRef.current[0] && startLat === originalStartRef.current[1]) {
        handleRouteCoordsChange([...originalRouteCoordsRef.current])
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...segment,
      segment_name: segmentName.trim() || segment.segment_id,
      road_class: roadClass,
      length_m: lengthM,
      commune_name: communeName.trim(),
      has_active_fault: hasActiveFault,
      start_coord: [startLng, startLat],
      end_coord: [endLng, endLat],
      coordinates: routeCoords,
    })
    onClose()
  }

  return (
    <>
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">
            <Route className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Chỉnh Sửa Tuyến Đường: {segment.segment_id}</h3>
            <p className="text-[11px] text-blue-200">{segment.segment_name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200 max-h-[75vh] overflow-y-auto">
        {/* Tên tuyến đường */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300">Tên tuyến đường:</label>
          <input
            type="text"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Cấp đường & Chiều dài */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Cấp đường quy hoạch:</label>
            <select
              value={roadClass}
              onChange={(e) => setRoadClass(e.target.value as any)}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="inter_commune">Đường liên xã</option>
              <option value="inter_village">Đường liên ấp / thôn</option>
              <option value="alley">Đường nhánh / ngõ hẻm</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Chiều dài tuyến (mét):</label>
            <input
              type="number"
              value={lengthM}
              onChange={(e) => setLengthM(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Địa bàn Xã & Trạng thái */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Địa bàn quản lý (Xã/Thị trấn):</label>
            <input
              type="text"
              value={communeName}
              onChange={(e) => setCommuneName(e.target.value)}
              placeholder="VD: Xã Phước Hậu"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Trạng thái vận hành lưới:</label>
            <select
              value={hasActiveFault ? 'fault' : 'normal'}
              onChange={(e) => setHasActiveFault(e.target.value === 'fault')}
              className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="normal">🟢 Vận hành tốt</option>
              <option value="fault">🔴 Có sự cố phân đoạn</option>
            </select>
          </div>
        </div>

        {/* Tọa độ Điểm đầu & Điểm cuối GPS */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Tọa độ Điểm Đầu & Điểm Cuối Tuyến (WGS84):</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            {/* Điểm đầu */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>🟢 Điểm đầu (Start GPS):</span>
                </div>
                {originalStartRef.current && (
                  <button
                    type="button"
                    onClick={handleResetStart}
                    title="Khôi phục điểm đầu ban đầu"
                    className="text-[10px] text-slate-400 hover:text-amber-500 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={startLat}
                    onChange={(e) => handleStartLatChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={startLng}
                    onChange={(e) => handleStartLngChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Điểm cuối */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>🔴 Điểm cuối (End GPS):</span>
                </div>
                {originalEndRef.current && (
                  <button
                    type="button"
                    onClick={handleResetEnd}
                    title="Khôi phục điểm cuối ban đầu"
                    className="text-[10px] text-slate-400 hover:text-amber-500 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={endLat}
                    onChange={(e) => handleEndLatChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-medium block">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={endLng}
                    onChange={(e) => handleEndLngChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-rose-500 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bản đồ Tuyến đường Thực địa (Segment Route Map) */}
        <div className="space-y-1.5 pt-1">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs">
            <span>Lộ trình Tim đường Thực địa Tuyến:</span>
          </label>
          <SegmentRouteMap
            coordinates={routeCoords}
            originalRouteCoords={originalRouteCoordsRef.current}
            startCoord={[startLng, startLat]}
            endCoord={[endLng, endLat]}
            originalStartCoord={originalStartRef.current}
            originalEndCoord={originalEndRef.current}
            editable={true}
            onStartCoordChange={handleStartCoordChange}
            onEndCoordChange={handleEndCoordChange}
            onRouteCoordsChange={handleRouteCoordsChange}
            poles={segmentPoles}
            height="240px"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 -mx-5 -mb-5 mt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </form>
    </>
  )
}

export const EditSegmentModal: React.FC<EditSegmentModalProps> = ({
  isOpen,
  segment,
  onClose,
  onSave,
}) => {
  if (!isOpen || !segment) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden animate-in zoom-in-95">
        <EditSegmentModalContent
          key={segment.segment_id}
          segment={segment}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>,
    document.body
  )
}

export default EditSegmentModal
