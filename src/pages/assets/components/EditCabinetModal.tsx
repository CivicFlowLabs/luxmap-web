import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Zap, X, CheckCircle2, MapPin } from 'lucide-react'
import { LocationPickerMap } from '../../../components/LocationPickerMap'
import type { AssetCabinetItem } from '../AssetManagementPage'

export interface EditCabinetModalProps {
  isOpen: boolean
  cabinet: AssetCabinetItem | null
  availableSegments?: Array<{ segment_id: string; segment_name: string }>
  onClose: () => void
  onSave: (updated: AssetCabinetItem) => void
}

export const EditCabinetModal: React.FC<EditCabinetModalProps> = ({
  isOpen,
  cabinet,
  availableSegments = [],
  onClose,
  onSave,
}) => {
  const [cabinetName, setCabinetName] = useState('')
  const [segmentId, setSegmentId] = useState('SEG-001')
  const [feederId, setFeederId] = useState('')
  const [status, setStatus] = useState<'active' | 'fault'>('active')
  const [voltageV, setVoltageV] = useState<number>(220)
  const [currentLoadKw, setCurrentLoadKw] = useState<number>(10)
  const [powerFactor, setPowerFactor] = useState<number>(0.95)
  const [landmarkNote, setLandmarkNote] = useState('')
  const [lat, setLat] = useState<number>(10.9701)
  const [lng, setLng] = useState<number>(106.4896)

  useEffect(() => {
    if (cabinet) {
      setCabinetName(cabinet.cabinet_name || '')
      setSegmentId(cabinet.segment_id || 'SEG-001')
      setFeederId(cabinet.feeder_id || `FDR-${cabinet.cabinet_id}`)
      setStatus(cabinet.status || 'active')
      setVoltageV(cabinet.voltage_v ?? 220)
      setCurrentLoadKw(cabinet.current_load_kw ?? 10)
      setPowerFactor(cabinet.power_factor ?? 0.95)
      setLandmarkNote(cabinet.landmark_note || '')
      setLat(typeof cabinet.lat === 'number' ? cabinet.lat : 10.9701)
      setLng(typeof cabinet.lng === 'number' ? cabinet.lng : 106.4896)
    }
  }, [cabinet])

  if (!isOpen || !cabinet) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const chosenSeg = availableSegments.find((s) => s.segment_id === segmentId)
    const segName = chosenSeg ? chosenSeg.segment_name : cabinet.segment_name

    onSave({
      ...cabinet,
      cabinet_name: cabinetName.trim() || cabinet.cabinet_id,
      segment_id: segmentId,
      segment_name: segName,
      feeder_id: feederId.trim() || `FDR-${cabinet.cabinet_id}`,
      status,
      voltage_v: voltageV,
      current_load_kw: currentLoadKw,
      power_factor: powerFactor,
      landmark_note: landmarkNote.trim(),
      lat,
      lng,
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Chỉnh Sửa Thông Số Tủ Điện: {cabinet.cabinet_id}</h3>
              <p className="text-[11px] text-purple-200">{cabinet.segment_name}</p>
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
          {/* Tên tủ & Tuyến đường */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tên tủ điện:</label>
              <input
                type="text"
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tuyến đường:</label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {availableSegments.length > 0 ? (
                  availableSegments.map((s) => (
                    <option key={s.segment_id} value={s.segment_id}>
                      {s.segment_name} ({s.segment_id})
                    </option>
                  ))
                ) : (
                  <option value={cabinet.segment_id}>{cabinet.segment_name}</option>
                )}
              </select>
            </div>
          </div>

          {/* Tuyến Feeder & Trạng thái */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tuyến điện (Feeder):</label>
              <input
                type="text"
                value={feederId}
                onChange={(e) => setFeederId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Trạng thái vận hành:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="active">🟢 Đang cấp điện tốt</option>
                <option value="fault">🔴 Sự cố ngắt tải</option>
              </select>
            </div>
          </div>

          {/* Điện áp & Công suất */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Điện áp (V):</label>
              <input
                type="number"
                value={voltageV}
                onChange={(e) => setVoltageV(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tải thực tế (kW):</label>
              <input
                type="number"
                step="0.1"
                value={currentLoadKw}
                onChange={(e) => setCurrentLoadKw(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Hệ số cosφ:</label>
              <input
                type="number"
                step="0.01"
                value={powerFactor}
                onChange={(e) => setPowerFactor(parseFloat(e.target.value) || 0.95)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Mốc thực địa */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Mốc định vị thực tế (Landmark Note):</label>
            <input
              type="text"
              value={landmarkNote}
              onChange={(e) => setLandmarkNote(e.target.value)}
              placeholder="VD: Cạnh trạm biến áp, ngã tư..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Tọa độ WGS84 & Mini-Map */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                <span>Tọa độ Tủ điện GIS (WGS84):</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Kinh độ (Longitude - °E):
                </span>
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Vĩ độ (Latitude - °N):
                </span>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Interactive Mini Map */}
            <div className="pt-1">
              <LocationPickerMap
                key={cabinet.id}
                lat={lat}
                lng={lng}
                originalLat={cabinet.lat}
                originalLng={cabinet.lng}
                onChange={({ lat: newLat, lng: newLng }) => {
                  setLat(newLat)
                  setLng(newLng)
                }}
                height="220px"
              />
            </div>
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
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
export default EditCabinetModal
