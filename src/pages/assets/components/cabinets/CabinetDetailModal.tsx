import React from 'react'
import { createPortal } from 'react-dom'
import { X, Zap, MapPin, Edit3 } from 'lucide-react'
import type { FeederListItem } from '../../../../types/assets/feeders'

interface CabinetDetailModalProps {
  cabinet: FeederListItem | null
  onClose: () => void
  onOpenEdit?: (cabinet: FeederListItem) => void
}

export const CabinetDetailModal: React.FC<CabinetDetailModalProps> = ({
  cabinet,
  onClose,
  onOpenEdit,
}) => {
  if (!cabinet) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 text-white flex items-center justify-between bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-white/25 px-2 py-0.5 rounded-md font-bold">
                  {cabinet.external_ref}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-100">
                  Đang Cấp Điện
                </span>
              </div>
              <h3 className="font-extrabold text-base mt-0.5">{cabinet.feeder_name || cabinet.external_ref}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">
                Số cột đèn quản lý
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                {cabinet.pole_count} cột
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">
                Trạng thái GIS
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>{cabinet.has_geometry ? 'Đã có tọa độ' : 'Chưa định vị'}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-2">
            <div className="font-bold text-purple-950 dark:text-purple-200 text-xs">
              Thông tin hành chính:
            </div>
            <div className="text-slate-600 dark:text-slate-300 space-y-1">
              <div><strong>Mã địa bàn (Commune):</strong> {cabinet.commune_id || 'Củ Chi'}</div>
              <div><strong>Mã tham chiếu ngoài:</strong> {cabinet.external_ref || 'Không có'}</div>
              {cabinet.updated_at && (
                <div><strong>Cập nhật lần cuối:</strong> {cabinet.updated_at}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex justify-end gap-2">
          {onOpenEdit && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenEdit(cabinet)
              }}
              className="px-4 py-2 bg-[#1f3864] dark:bg-blue-600 hover:bg-[#1f3864]/90 dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
