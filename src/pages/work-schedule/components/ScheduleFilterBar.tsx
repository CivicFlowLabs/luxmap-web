import React from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Plus, Filter, Calendar } from 'lucide-react'
import { WorkScheduleState } from '../../../feature/work-schedule/workScheduleSlice'

interface ScheduleFilterBarProps {
  currentMonth: number
  currentYear: number
  filterPhase: WorkScheduleState['filterPhase']
  onPrevMonth: () => void
  onNextMonth: () => void
  onResetToday: () => void
  onFilterChange: (phase: WorkScheduleState['filterPhase']) => void
  onOpenCreateModal: () => void
}

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

export const ScheduleFilterBar: React.FC<ScheduleFilterBarProps> = ({
  currentMonth,
  currentYear,
  filterPhase,
  onPrevMonth,
  onNextMonth,
  onResetToday,
  onFilterChange,
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
      {/* Cụm điều hướng tháng */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
          title="Tháng trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl min-w-40 justify-center">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-sm text-slate-800">
            {MONTH_NAMES[currentMonth]} / {currentYear}
          </span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
          title="Tháng sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onResetToday}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer active:scale-95 ml-1"
          title="Về tháng hiện tại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hôm nay</span>
        </button>
      </div>

      {/* Cụm bộ lọc & Nút tạo sự vụ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <label className="text-xs font-bold text-slate-600">Giai đoạn:</label>
          <select
            value={filterPhase}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
          >
            <option value="all">Tất cả giai đoạn</option>
            <option value="survey">🟡 1. Khảo sát (Survey)</option>
            <option value="inspection">🔵 2. Kiểm tra (Inspection)</option>
            <option value="repair">🟢 3. Sửa chữa (Repair)</option>
            <option value="ended">⚪ Đã kết thúc (END)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo sự vụ mới</span>
        </button>
      </div>
    </div>
  )
}
