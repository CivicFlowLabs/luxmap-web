import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  PlusCircle,
  X,
  MapPin,
  CheckCircle2,
  Trash2,
  Route,
  Layers,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { DatePicker } from '../../../../components/DatePicker'
import type { PoleListItem } from '../../../../types/assets/poles'
import type { SegmentListItem } from '../../../../types/assets/segments'
import type { FeederListItem } from '../../../../types/assets/feeders'

interface AddPoleModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPole?: (data: PoleListItem) => void
  onAddPoles: (poles: PoleListItem[]) => void
  existingPoleCount: number
  availableSegments?: SegmentListItem[]
  availableCabinets?: FeederListItem[]
}

interface PoleRowDraft {
  rowId: string
  pole_id: string
  lat: string
  lng: string
  lamp_watt: number
  atlas: string
  near_sensitive_poi: boolean
}

const DEFAULT_SEGMENTS: SegmentListItem[] = [
  { segment_id: 'SEG-001', external_ref: 'SEG-001', segment_name: 'Tuyến A - Tỉnh Lộ 8', road_class: 'inter_commune', length_m: 1200, commune_id: 'COM-001', data_source: 'field', pole_count: 46, updated_at: null },
  { segment_id: 'SEG-002', external_ref: 'SEG-002', segment_name: 'Tuyến B - Nguyễn Văn Ni', road_class: 'inter_commune', length_m: 850, commune_id: 'COM-001', data_source: 'field', pole_count: 31, updated_at: null },
  { segment_id: 'SEG-003', external_ref: 'SEG-003', segment_name: 'Tuyến C - Huỳnh Văn Cọ', road_class: 'inter_village', length_m: 720, commune_id: 'COM-001', data_source: 'field', pole_count: 26, updated_at: null },
]

export const AddPoleModal: React.FC<AddPoleModalProps> = ({
  isOpen,
  onClose,
  onAddPole,
  onAddPoles,
  existingPoleCount,
  availableSegments,
  availableCabinets,
}) => {
  const segmentList = availableSegments && availableSegments.length > 0 ? availableSegments : DEFAULT_SEGMENTS

  // Top Section States
  const [selectedSegmentId, setSelectedSegmentId] = useState('')
  const [selectedCabinetId, setSelectedCabinetId] = useState('')
  const [defaultWarranty, setDefaultWarranty] = useState('')

  const warrantyDate = defaultWarranty ? new Date(defaultWarranty.replace(/-/g, '/')) : null

  const handleWarrantyChange = (date: Date | null) => {
    if (date) {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      setDefaultWarranty(`${y}-${m}-${d}`)
    } else {
      setDefaultWarranty('')
    }
  }

  // Bottom Section: Pole Rows State
  const [rows, setRows] = useState<PoleRowDraft[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Current active metadata
  const currentSegment = segmentList.find((s) => s.segment_id === selectedSegmentId)
  const availableCabinetsOnSegment = availableCabinets || []
  const currentCabinet = availableCabinetsOnSegment.find((c) => c.feeder_id === selectedCabinetId)

  // Handle segment change: reset cabinet selection
  const handleSegmentChange = (newSegmentId: string) => {
    setSelectedSegmentId(newSegmentId)
    setSelectedCabinetId('')
    setErrorMsg(null)
  }

  // Reset all fields to empty/null when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null)
      setSelectedSegmentId('')
      setSelectedCabinetId('')
      setDefaultWarranty('')
      setRows([])
    }
  }, [isOpen])

  if (!isOpen) return null

  // Handler: Add New Pole Row at top/end
  const handleAddRow = () => {
    setErrorMsg(null)

    if (!selectedSegmentId) {
      setErrorMsg('Vui lòng chọn Tuyến đường áp dụng ở mục 1 trước khi thêm cột đèn!')
      return
    }

    if (!selectedCabinetId) {
      setErrorMsg('Vui lòng chọn Tủ điện điều khiển trực tiếp quản lý các cột đèn này!')
      return
    }

    // Calculate incremental coordinates from previous row if available
    let nextLat = ''
    let nextLng = ''
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1]
      const lastLat = parseFloat(lastRow.lat)
      const lastLng = parseFloat(lastRow.lng)
      if (!isNaN(lastLat) && !isNaN(lastLng)) {
        nextLat = (lastLat + 0.00028).toFixed(6)
        nextLng = (lastLng + 0.00025).toFixed(6)
      }
    } else {
      nextLat = '10.9715'
      nextLng = '106.4925'
    }

    const newRow: PoleRowDraft = {
      rowId: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pole_id: '',
      lat: nextLat,
      lng: nextLng,
      lamp_watt: 100,
      atlas: '',
      near_sensitive_poi: false,
    }

    setRows((prev) => [...prev, newRow])
  }

  // Auto-generate sequentially formatted IDs for all rows
  const handleAutoFillIds = () => {
    setErrorMsg(null)
    const startNum = existingPoleCount + 1

    setRows((prev) =>
      prev.map((row, idx) => ({
        ...row,
        pole_id: `POLE-${String(startNum + idx).padStart(4, '0')}`,
      }))
    )
  }

  // Handler: Delete row
  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId))
  }

  // Handler: Update specific field in row
  const handleUpdateRow = (rowId: string, field: keyof PoleRowDraft, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r))
    )
  }

  // Batch Submit Handler
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedSegmentId) {
      setErrorMsg('Vui lòng chọn Tuyến đường áp dụng!')
      return
    }

    if (!selectedCabinetId) {
      setErrorMsg('Vui lòng chọn Tủ điện điều khiển trực tiếp quản lý các cột!')
      return
    }

    if (rows.length === 0) {
      setErrorMsg('Vui lòng bấm "+ Thêm Cột Mới" để khai báo ít nhất một cột đèn!')
      return
    }

    // Validate each row
    const idSet = new Set<string>()
    const validatedDataList: PoleListItem[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const trimmedId = row.pole_id.trim()

      if (!trimmedId) {
        setErrorMsg(`Hàng #${i + 1}: Mã cột đèn không được để trống!`)
        return
      }

      if (idSet.has(trimmedId.toLowerCase())) {
        setErrorMsg(`Mã cột "${trimmedId}" bị trùng lặp trong danh sách khai báo!`)
        return
      }
      idSet.add(trimmedId.toLowerCase())

      const parsedLat = parseFloat(row.lat)
      const parsedLng = parseFloat(row.lng)

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        setErrorMsg(`Hàng #${i + 1} (${trimmedId}): Tọa độ GPS không hợp lệ (Vĩ độ và Kinh độ phải là số)!`)
        return
      }

      if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        setErrorMsg(`Hàng #${i + 1} (${trimmedId}): Tọa độ vượt quá phạm vi địa lý (Lat: -90..90, Lng: -180..180)!`)
        return
      }

      validatedDataList.push({
        pole_id: trimmedId,
        external_ref: trimmedId,
        segment_id: selectedSegmentId,
        feeder_id: selectedCabinetId,
        commune_id: currentSegment?.commune_id || 'COM-001',
        data_source: 'field',
        near_sensitive_poi: !!row.near_sensitive_poi,
        location: {
          lat: parsedLat,
          lng: parsedLng,
        },
        active_fixture: {
          fixture_id: `FIX-${trimmedId}`,
          fixture_type: 'led_road_lamp',
          power_source: 'grid',
          lamp_watt: row.lamp_watt || 100,
          install_date: new Date().toISOString().split('T')[0],
          warranty_expiry: defaultWarranty || '2026-12-31',
          data_source: 'field',
        },
        updated_at: new Date().toISOString(),
      })
    }

    if (onAddPoles) {
      onAddPoles(validatedDataList)
    } else if (onAddPole && validatedDataList.length > 0) {
      onAddPole(validatedDataList[0])
    }

    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-[#172b4d] via-[#1f3864] to-[#25457a] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Thêm Cột Đèn Mới Vào Hệ Thống GIS
              </h3>
              <p className="text-xs text-slate-300">
                Khai báo theo Tuyến đường và Tủ điện quản lý nguồn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form onSubmit={handleBatchSubmit} className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200 flex-1">
          {/* ================= SECTION 1: THÔNG TIN TUYẾN ĐƯỜNG & TỦ ĐIỆN ================= */}
          <div className="p-4 bg-slate-50/70 hover:bg-slate-50/90 dark:bg-slate-800/50 dark:hover:bg-slate-800/70 rounded-2xl border border-slate-200/90 hover:border-slate-300 dark:border-slate-700/80 dark:hover:border-slate-600 space-y-3 shadow-2xs hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                <Route className="w-4 h-4 text-[#1f3864] dark:text-blue-400 drop-shadow-2xs" />
                <span>1. Thiết Lập Tuyến Đường, Tủ Điện & Thông Số Chung</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                (1 Cột đèn được quản lý bởi duy nhất 1 Tủ điện)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Select Segment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                  <span>1. Tuyến đường áp dụng:</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">(Bắt buộc)</span>
                </label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => handleSegmentChange(e.target.value)}
                  className={`w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1f3864]/20 focus:border-[#1f3864] ${
                    !selectedSegmentId
                      ? 'text-slate-400 border-slate-300 dark:border-slate-700'
                      : 'text-slate-900 dark:text-slate-100 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                  }`}
                >
                  <option value="" disabled className="text-slate-400 font-normal">
                    -- Chọn tuyến đường áp dụng --
                  </option>
                  {segmentList.map((seg) => (
                    <option key={seg.segment_id || ''} value={seg.segment_id || ''} className="text-slate-900 dark:text-slate-100">
                      {seg.segment_name} ({seg.segment_id} • {seg.pole_count || 0} cột)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Select Cabinet */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                  <span>2. Tủ điện điều khiển trực tiếp:</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">(1 Cột - 1 Tủ)</span>
                </label>
                <select
                  value={selectedCabinetId}
                  onChange={(e) => {
                    setSelectedCabinetId(e.target.value)
                    setErrorMsg(null)
                  }}
                  disabled={!selectedSegmentId}
                  className={`w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
                    !selectedCabinetId
                      ? 'text-slate-400 border-slate-300 dark:border-slate-700'
                      : 'text-slate-900 dark:text-slate-100 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                  }`}
                >
                  <option value="" disabled className="text-slate-400 font-normal">
                    {selectedSegmentId
                      ? availableCabinetsOnSegment.length > 0
                        ? '-- Chọn tủ điện quản lý --'
                        : '-- Tuyến này chưa có tủ điện --'
                      : '-- Vui lòng chọn Tuyến trước --'}
                  </option>
                  {availableCabinetsOnSegment.map((cab) => (
                    <option key={cab.feeder_id || ''} value={cab.feeder_id || ''} className="text-slate-900 dark:text-slate-100">
                      ⚡️ {cab.feeder_name || cab.feeder_id} ({cab.feeder_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Warranty Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
                  <span>3. Hạn bảo hành mặc định:</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Áp dụng cả lô)</span>
                </label>
                <DatePicker
                  value={warrantyDate}
                  onChange={handleWarrantyChange}
                  placeholder="Chọn hạn bảo hành"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: DANH SÁCH CỘT ĐÈN ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Danh Sách Cột Đèn Thuộc Tủ</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {rows.length} cột đã thêm
                </span>
                {currentCabinet && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    <span>{currentCabinet.feeder_name || currentCabinet.feeder_id}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Thêm Cột Mới</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3 min-w-36">
                        <div className="flex items-center justify-between gap-1">
                          <span>Mã Cột Đèn (*)</span>
                          {rows.length > 0 && (
                            <button
                              type="button"
                              onClick={handleAutoFillIds}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                              title="Tự động sinh mã POLE-xxxx liên tục"
                            >
                              (Tự sinh)
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 min-w-28">Kinh độ (Lng) (*)</th>
                      <th className="py-2.5 px-3 min-w-28">Vĩ độ (Lat) (*)</th>
                      <th className="py-2.5 px-3 min-w-24">Công suất (W)</th>
                      <th className="py-2.5 px-3 min-w-28 text-center">Nhạy cảm (POI)</th>
                      <th className="py-2.5 px-3 min-w-32">Ghi chú vị trí</th>
                      <th className="py-2.5 px-3 w-14 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                          Chưa có cột đèn nào trong danh sách. Bấm{' '}
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="text-emerald-600 dark:text-emerald-400 font-bold underline cursor-pointer"
                          >
                            + Thêm Cột Mới
                          </button>{' '}
                          để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr key={row.rowId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.pole_id}
                              onChange={(e) => handleUpdateRow(row.rowId, 'pole_id', e.target.value)}
                              placeholder={`POLE-${String(existingPoleCount + index + 1).padStart(4, '0')}`}
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1f3864]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.lng}
                              onChange={(e) => handleUpdateRow(row.rowId, 'lng', e.target.value)}
                              placeholder="106.4896"
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1f3864]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.lat}
                              onChange={(e) => handleUpdateRow(row.rowId, 'lat', e.target.value)}
                              placeholder="10.9701"
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1f3864]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.lamp_watt}
                              onChange={(e) => handleUpdateRow(row.rowId, 'lamp_watt', Number(e.target.value))}
                              className="w-full p-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                            >
                              <option value={50}>50W</option>
                              <option value={60}>60W</option>
                              <option value={100}>100W</option>
                              <option value={120}>120W</option>
                              <option value={150}>150W</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.near_sensitive_poi}
                              onChange={(e) => handleUpdateRow(row.rowId, 'near_sensitive_poi', e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.atlas}
                              onChange={(e) => handleUpdateRow(row.rowId, 'atlas', e.target.value)}
                              placeholder="Gần ngã 3..."
                              className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.rowId)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
              className="px-5 py-2 bg-[#1f3864] dark:bg-blue-600 hover:bg-[#1f3864]/90 dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Lưu ({rows.length} Cột)</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
