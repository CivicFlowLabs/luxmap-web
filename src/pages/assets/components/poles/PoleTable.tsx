import React from 'react'
import { Eye, Edit2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '../../../../components/StatusBadge'
import type { PoleListItem } from '../../../../types/assets/poles'
import type { FeederListItem } from '../../../../types/assets/feeders'
import type { SegmentListItem } from '../../../../types/assets/segments'

export interface PoleTableProps {
  poles: PoleListItem[]
  cabinets: FeederListItem[]
  segments: SegmentListItem[]
  onViewDetail: (pole: PoleListItem) => void
  onEdit: (pole: PoleListItem) => void
  onViewCabinetDetail: (cabinet: FeederListItem) => void
}

export const PoleTable: React.FC<PoleTableProps> = ({
  poles,
  cabinets,
  segments,
  onViewDetail,
  onEdit,
  onViewCabinetDetail,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5">Mã cột</th>
              <th className="p-3.5">Tuyến đường</th>
              <th className="p-3.5">Tủ điện nguồn</th>
              <th className="p-3.5">Địa bàn</th>
              <th className="p-3.5">Công suất</th>
              <th className="p-3.5">Trạng thái</th>
              <th className="p-3.5">Bảo hành</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {poles.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-400 text-xs">
                  Không tìm thấy cột đèn nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              poles.map((pole) => {
                const seg = segments.find(
                  (s) => s.segment_id === pole.segment_id || (s.external_ref && s.external_ref.toLowerCase() === pole.segment_id?.toLowerCase())
                )
                const segmentName = seg?.segment_name || (seg?.external_ref ? `Tuyến ${seg.external_ref}` : 'Chưa gắn')

                const targetCab = cabinets.find(
                  (c) => c.feeder_id === pole.feeder_id || (c.external_ref && c.external_ref.toLowerCase() === pole.feeder_id?.toLowerCase())
                )
                const feederLabel = targetCab?.feeder_name || targetCab?.external_ref || 'Chưa gắn'
                const watt = pole.active_fixture?.lamp_watt
                const fixtureStatus = pole.active_fixture ? 'normal' : 'out'
                const warrantyExpiry = pole.active_fixture?.warranty_expiry

                return (
                  <tr key={pole.external_ref || pole.pole_id || Math.random()} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {pole.external_ref}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-200 max-w-45 truncate" title={segmentName}>
                      {segmentName}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (targetCab) {
                            onViewCabinetDetail(targetCab)
                          } else {
                            toast.info('Chưa có thông tin mở rộng cho tủ điện này')
                          }
                        }}
                        className="cursor-pointer inline-flex flex-col items-start text-left group transition"
                        title={`Tủ điện: ${feederLabel} - Bấm xem chi tiết`}
                      >
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-semibold shadow-2xs group-hover:border-indigo-400 group-hover:bg-indigo-100/70 transition">
                          <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 shrink-0" />
                          <span className="font-bold tracking-tight font-mono text-xs">{targetCab?.external_ref || 'Chưa gắn'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 pl-0.5 max-w-36 truncate">
                          {feederLabel}
                        </span>
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-300">{pole.commune_id || 'Củ Chi'}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {watt ? `${watt}W` : '—'}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge type="fixture" status={fixtureStatus} size="sm" />
                    </td>
                    <td className="p-3.5">
                      {(() => {
                        if (!warrantyExpiry) {
                          return <span className="text-slate-400 dark:text-slate-500 font-mono">—</span>
                        }
                        const expDate = new Date(warrantyExpiry)
                        const isExpired = !isNaN(expDate.getTime()) && expDate < new Date()
                        return (
                          <div
                            className="inline-flex items-center gap-1.5"
                            title={isExpired ? `Đã hết hạn bảo hành từ ${warrantyExpiry}` : `Còn bảo hành đến ${warrantyExpiry}`}
                          >
                            <span className={`font-mono text-[11px] ${isExpired ? 'text-slate-400 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-semibold'}`}>
                              {warrantyExpiry}
                            </span>
                            {isExpired ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shrink-0">
                                Hết hạn
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                                Còn hạn
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetail(pole)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-sky-300 font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1 border border-transparent dark:border-sky-500/20"
                      >
                        <Eye className="w-3 h-3 text-sky-400" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(pole)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1 border border-transparent dark:border-slate-700"
                      >
                        <Edit2 className="w-3 h-3 text-slate-300" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
