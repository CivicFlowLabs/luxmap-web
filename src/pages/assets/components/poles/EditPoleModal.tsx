import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Edit3, X, CheckCircle2, MapPin } from 'lucide-react'
import { LocationPickerMap } from '../../../../components/LocationPickerMap'
import type { PoleListItem } from '../../../../types/assets/poles'

interface EditPoleModalProps {
  isOpen: boolean
  pole: PoleListItem | null
  onClose: () => void
  onSave: (updated: PoleListItem) => void
}

export const EditPoleModal: React.FC<EditPoleModalProps> = ({
  isOpen,
  pole,
  onClose,
  onSave,
}) => {
  const [lampWatt, setLampWatt] = useState<number>(100)
  const [feederId, setFeederId] = useState('')
  const [warrantyExpiry, setWarrantyExpiry] = useState('')
  const [lat, setLat] = useState<number>(10.9701)
  const [lng, setLng] = useState<number>(106.4896)

  useEffect(() => {
    if (pole) {
      setLampWatt(pole.active_fixture?.lamp_watt || 100)
      setFeederId(pole.feeder_id || '')
      setWarrantyExpiry(pole.active_fixture?.warranty_expiry || '')
      setLat(typeof pole.location?.lat === 'number' ? pole.location.lat : 10.9701)
      setLng(typeof pole.location?.lng === 'number' ? pole.location.lng : 106.4896)
    }
  }, [pole])

  if (!isOpen || !pole) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updated: PoleListItem = {
      ...pole,
      feeder_id: feederId || null,
      location: {
        lat,
        lng,
      },
      active_fixture: pole.active_fixture
        ? {
            ...pole.active_fixture,
            lamp_watt: lampWatt,
            warranty_expiry: warrantyExpiry || null,
          }
        : undefined,
      updated_at: new Date().toISOString(),
    }
    onSave(updated)
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
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 dark:bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Chỉnh Sửa Thông Số Cột: {pole.pole_id}</h3>
              <p className="text-[11px] text-slate-300 dark:text-slate-400">Địa bàn: {pole.commune_id || 'Củ Chi'}</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Công suất đèn:</label>
              <select
                value={lampWatt}
                onChange={(e) => setLampWatt(Number(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value={50} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">50W</option>
                <option value={60} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">60W</option>
                <option value={100} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">100W LED</option>
                <option value={120} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">120W LED</option>
                <option value={150} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">150W Cao Áp</option>
                <option value={200} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">200W Đô Thị</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Nguồn cấp:</label>
              <select
                value="grid"
                disabled
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-not-allowed"
              >
                <option value="grid" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Lưới điện 220V</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Tủ / Lộ Feeder kết nối:</label>
              <input
                type="text"
                value={feederId}
                onChange={(e) => setFeederId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Bảo hành đến:</label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Tọa độ WGS84 & Mini-Map */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Tọa độ Bản đồ GIS (WGS84):</span>
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
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1f3864] dark:focus:border-blue-500"
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
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1f3864] dark:focus:border-blue-500"
                />
              </div>
            </div>

            {/* Interactive Mini Map */}
            <div className="pt-1">
              <LocationPickerMap
                key={pole.pole_id || 'edit-picker'}
                lat={lat}
                lng={lng}
                originalLat={pole.location?.lat || 10.9701}
                originalLng={pole.location?.lng || 106.4896}
                onChange={({ lat: newLat, lng: newLng }) => {
                  setLat(newLat)
                  setLng(newLng)
                }}
                height="230px"
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
              className="px-5 py-2 bg-[#1f3864] dark:bg-blue-600 hover:bg-[#1f3864]/90 dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
