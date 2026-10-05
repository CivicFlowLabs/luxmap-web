import React, { useState, useEffect } from 'react'
import {
  X,
  Check,
  AlertTriangle,
  FileCheck,
  Send,
  Calendar,
  User,
  MapPin,
  Clock,
  Wrench,
  Video,
  ExternalLink,
  Play,
  Zap,
} from 'lucide-react'
import { ScheduleCase } from '../../../types/workSchedule'
import { FieldReportDetailModal } from './FieldReportDetailModal'
import fieldSurveyNightImg from '../../../assets/images/field-survey-night.jpg'
import fieldBrokenFixtureImg from '../../../assets/images/field-broken-fixture.jpg'
import fieldLuxmeterImg from '../../../assets/images/field-luxmeter-4lux.jpg'

interface CaseDetailModalProps {
  isOpen: boolean
  caseItem: ScheduleCase | null
  viewingPhaseIndex: number
  onClose: () => void
  onSwitchViewingPhase: (index: number) => void
  onRejectCurrentPhase: (code: string) => void
  onEndNormally: (code: string, reason: string) => void
  onOpenCreateNextPhaseModal: (code: string, phaseType: 'inspection' | 'repair') => void
  onSubmitSuperior: (code: string, editedMaterialsNote: string) => void
}

const STEPPER_STEPS = [
  { type: 'survey', label: '1. Khảo sát' },
  { type: 'inspection', label: '2. Kiểm tra' },
  { type: 'repair', label: '3. Sửa chữa' },
  { type: 'superior', label: '4. Cấp trên' },
]

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  isOpen,
  caseItem,
  viewingPhaseIndex,
  onClose,
  onSwitchViewingPhase,
  onRejectCurrentPhase,
  onEndNormally,
  onOpenCreateNextPhaseModal,
  onSubmitSuperior,
}) => {
  // Trạng thái cục bộ khi duyệt khảo sát / kiểm tra để chuyển nút thành (Tạo tiếp / End)
  const [isSurveyApprovedLocal, setIsSurveyApprovedLocal] = useState(false)
  const [isInspectionApprovedLocal, setIsInspectionApprovedLocal] = useState(false)

  // State cho Quản lý tự do chỉnh sửa ghi chú vật tư thực tế ở bước sửa chữa
  const [editedMaterialsNote, setEditedMaterialsNote] = useState('')

  // State mở modal báo cáo hiện trường chi tiết (kèm video & ảnh)
  const [isFieldReportModalOpen, setIsFieldReportModalOpen] = useState(false)

  useEffect(() => {
    setIsSurveyApprovedLocal(false)
    setIsInspectionApprovedLocal(false)
    if (caseItem) {
      const currentP = caseItem.phases[viewingPhaseIndex]
      if (currentP?.report?.usedMaterialsNote) {
        setEditedMaterialsNote(currentP.report.usedMaterialsNote)
      } else {
        setEditedMaterialsNote('')
      }
    }
  }, [caseItem, viewingPhaseIndex, isOpen])

  if (!isOpen || !caseItem) return null

  const currentPhase = caseItem.phases[viewingPhaseIndex]
  const isActivePhase = viewingPhaseIndex === caseItem.currentPhaseIndex
  const hasReport = currentPhase?.status === 'reported'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-blue-600 text-sm">{caseItem.code}</span>
                <span className="text-slate-400">•</span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Hồ Sơ Tiến Trình Sự Vụ
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{caseItem.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* ======================================================== */}
          {/* THANH TIẾN TRÌNH STEPPER 4 BƯỚC */}
          {/* ======================================================== */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Vòng đời sự vụ (Bấm để xem lại lịch sử các bước):
            </div>
            <div className="flex items-center justify-between relative select-none">
              {STEPPER_STEPS.map((step, idx) => {
                const isCompleted = idx < caseItem.currentPhaseIndex
                const isActive = idx === caseItem.currentPhaseIndex && !caseItem.isTerminated
                const isEnded = idx === caseItem.currentPhaseIndex && caseItem.isTerminated
                const isViewing = idx === viewingPhaseIndex

                let circleClass = 'bg-slate-200 text-slate-500 border-slate-300'
                if (isCompleted) {
                  circleClass = 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                } else if (isActive) {
                  circleClass = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 shadow-xs'
                } else if (isEnded) {
                  circleClass = 'bg-slate-400 text-white border-slate-400'
                }

                return (
                  <React.Fragment key={step.type}>
                    <div
                      onClick={() => {
                        if (idx < caseItem.phases.length) {
                          onSwitchViewingPhase(idx)
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 cursor-pointer z-10 transition-transform ${
                        idx < caseItem.phases.length ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${circleClass} ${
                          isViewing ? 'scale-110 ring-4 ring-blue-500/25 ring-offset-2 ring-offset-white shadow-md' : ''
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isViewing
                            ? 'text-blue-700 font-extrabold underline underline-offset-4 decoration-2 decoration-blue-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {/* Connector line giữa các node */}
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                          idx < caseItem.currentPhaseIndex ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Thông báo sự vụ nếu đã kết thúc (Terminated / END) */}
          {caseItem.isTerminated && (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 flex items-start gap-2.5 text-xs text-slate-700">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sự vụ đã đóng (END):</strong> {caseItem.endReason || 'Đã hoàn tất vòng đời.'}
              </div>
            </div>
          )}

          {/* Chi tiết giai đoạn đang xem */}
          {currentPhase ? (
            <div className="flex flex-col gap-4">
              {/* Thông tin metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Tuyến đường thực hiện
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                    {caseItem.segment}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Ngày thực hiện
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{currentPhase.date}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Kỹ sư hiện trường
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {currentPhase.assigneeName} ({currentPhase.assigneeId})
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Trạng thái bước này
                  </div>
                  <div className="text-xs font-bold mt-1">
                    {currentPhase.status === 'ended' ? (
                      <span className="text-slate-500">Đã END (Đã chốt)</span>
                    ) : currentPhase.status === 'reported' ? (
                      <span className="text-blue-600">Đã có báo cáo (Chờ Quản lý duyệt)</span>
                    ) : (
                      <span className="text-amber-600">Đang thực hiện</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cột đèn tác nghiệp (dành riêng cho Kiểm tra hoặc Sửa chữa) */}
              {currentPhase.phaseType !== 'survey' ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Cột đèn cần tác nghiệp ({currentPhase.poleIds?.length || caseItem.poleIds?.length || 0} cột):
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                      Chỉ định cho Kỹ sư hiện trường
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {(currentPhase.poleIds || caseItem.poleIds || []).map((pId) => (
                      <span
                        key={pId}
                        className="px-2 py-0.5 bg-white border border-amber-300 text-amber-950 font-mono text-[11px] font-extrabold rounded-lg shadow-2xs"
                      >
                        {pId}
                      </span>
                    ))}
                    {(!currentPhase.poleIds || currentPhase.poleIds.length === 0) &&
                      (!caseItem.poleIds || caseItem.poleIds.length === 0) && (
                        <span className="text-xs text-amber-700 italic">
                          Chưa có thông tin cột cụ thể
                        </span>
                      )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                  <span className="font-bold">Phạm vi tác nghiệp:</span>
                  <span>Khảo sát ghi hình toàn tuyến (Quét AI Computer Vision, không giới hạn cột lẻ)</span>
                </div>
              )}

              {/* Chỉ đạo kỹ thuật ban đầu của Quản lý */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900">
                <strong>Chỉ đạo của Quản lý:</strong>{' '}
                {currentPhase.notes || 'Thực hiện nghiêm túc quy chuẩn an toàn lao động.'}
              </div>

              {/* Chi tiết nội dung báo cáo của Kỹ sư */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    Báo cáo nghiệm thu: {currentPhase.name}
                  </span>
                  {currentPhase.report?.submittedAt && (
                    <span className="text-[11px] text-slate-500">
                      Nộp lúc: {currentPhase.report.submittedAt}
                    </span>
                  )}
                </div>

                {currentPhase.report ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {currentPhase.report.summary}
                    </p>

                    {/* NÚT BẤM NỔI BẬT: XEM BÁO CÁO HIỆN TRƯỜNG (KÈM VIDEO & ẢNH) */}
                    <button
                      type="button"
                      onClick={() => setIsFieldReportModalOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-white/20">
                          <Video className="w-4 h-4 text-white" />
                        </span>
                        <span className="tracking-tight">Xem Báo Cáo Hiện Trường Thực Địa (Ảnh & Video)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        <span>1 Video • 3 Ảnh • Lux</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>

                    {/* Thư viện thumbnails bằng chứng hiện trường có thể click mở trực tiếp */}
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setIsFieldReportModalOpen(true)}
                        className="relative rounded-xl overflow-hidden aspect-4/3 border border-slate-200 cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                        title="Bấm để xem video quét thực địa ban đêm"
                      >
                        <img
                          src={fieldSurveyNightImg}
                          alt="Video Khảo Sát Đêm"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-white/90 text-blue-600 flex items-center justify-center shadow">
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-blue-600" />
                          </span>
                        </div>
                        <span className="absolute bottom-1 inset-x-1 text-center bg-slate-900/80 text-white text-[9px] font-bold rounded py-0.5 truncate">
                          Video đêm 00:45
                        </span>
                      </div>

                      <div
                        onClick={() => setIsFieldReportModalOpen(true)}
                        className="relative rounded-xl overflow-hidden aspect-4/3 border border-slate-200 cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                        title="Bấm để xem ảnh chi tiết đui đèn hỏng"
                      >
                        <img
                          src={fieldBrokenFixtureImg}
                          alt="Chao đèn cháy hỏng"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 inset-x-1 text-center bg-slate-900/80 text-white text-[9px] font-bold rounded py-0.5 truncate">
                          Ảnh đui đèn hỏng
                        </span>
                      </div>

                      <div
                        onClick={() => setIsFieldReportModalOpen(true)}
                        className="relative rounded-xl overflow-hidden aspect-4/3 border border-slate-200 cursor-pointer group shadow-2xs hover:shadow-md transition-all"
                        title="Bấm để xem ảnh máy đo Luxmeter"
                      >
                        <img
                          src={fieldLuxmeterImg}
                          alt="Đo Luxmeter"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 inset-x-1 text-center bg-slate-900/80 text-white text-[9px] font-bold rounded py-0.5 truncate">
                          Đo đạt 4.2 Lux
                        </span>
                      </div>
                    </div>

                    {/* Detections AI phát hiện sự cố (nếu là Khảo sát) */}
                    {currentPhase.report.aiDetections &&
                      currentPhase.report.aiDetections.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <span className="text-[11px] font-bold text-slate-600">
                            Phát hiện từ mô hình Computer Vision:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentPhase.report.aiDetections.map((d, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                              >
                                <span>
                                  <strong>{d.poleId}</strong>: {d.issue}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  AI: {(d.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Đo Lux & Ghi chú vật tư đề xuất (nếu là Kiểm tra) */}
                    {currentPhase.report.luxMeasured && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                        <strong>Độ rọi Lux đo thực tế:</strong> {currentPhase.report.luxMeasured}
                      </div>
                    )}

                    {currentPhase.report.suggestedMaterialsNote && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                        <strong>Ghi chú thiết bị & vật tư đề xuất (Kỹ sư tự nhập):</strong>
                        <p className="mt-1 font-semibold">
                          {currentPhase.report.suggestedMaterialsNote}
                        </p>
                      </div>
                    )}

                    {/* Ô GHI CHÚ VẬT TƯ THỰC TẾ (NẾU LÀ SỬA CHỮA) - QUẢN LÝ ĐƯỢC QUYỀN SỬA */}
                    {currentPhase.phaseType === 'repair' && (
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                        <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                          Ghi chú thiết bị & vật tư thực tế đã sử dụng (Quản lý được quyền tự do
                          chỉnh sửa):
                        </label>
                        <textarea
                          rows={2}
                          value={editedMaterialsNote}
                          onChange={(e) => setEditedMaterialsNote(e.target.value)}
                          placeholder="Ví dụ: 02 bóng LED 100W Rạng Đông, 01 cuộn cáp..."
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    ⏳ Kỹ sư hiện trường đang xử lý nhiệm vụ, chưa nộp báo cáo.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Giai đoạn này chưa được mở trong vòng đời sự vụ.
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Đóng
          </button>

          {/* Các nút hành động tác nghiệp Quản lý */}
          {isActivePhase && hasReport && !caseItem.isTerminated && (
            <div className="flex items-center gap-2">
              {/* Giai đoạn 1: Khảo sát */}
              {currentPhase.phaseType === 'survey' && (
                <>
                  {!isSurveyApprovedLocal ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRejectCurrentPhase(caseItem.code)}
                        className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer"
                      >
                        ✕ Không duyệt (Tự END)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSurveyApprovedLocal(true)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        ✓ Duyệt báo cáo khảo sát
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onEndNormally(caseItem.code, 'Khảo sát hoàn tất, tuyến đèn đạt chuẩn.')
                        }
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        ⚪ End (Không có lỗi)
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCreateNextPhaseModal(caseItem.code, 'inspection')}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        ➕ Tạo lịch kiểm tra (Cùng mã {caseItem.code})
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Giai đoạn 2: Kiểm tra */}
              {currentPhase.phaseType === 'inspection' && (
                <>
                  {!isInspectionApprovedLocal ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRejectCurrentPhase(caseItem.code)}
                        className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer"
                      >
                        ✕ Không duyệt (Tự END)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInspectionApprovedLocal(true)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        ✓ Duyệt báo cáo kiểm tra
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onEndNormally(
                            caseItem.code,
                            'Kiểm tra xác nhận tuyến đèn hoạt động bình thường.'
                          )
                        }
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        ⚪ End (Không có sự cố thực tế)
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCreateNextPhaseModal(caseItem.code, 'repair')}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        🔧 Tạo lịch sửa chữa (Cùng mã {caseItem.code})
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Giai đoạn 3: Sửa chữa */}
              {currentPhase.phaseType === 'repair' && (
                <>
                  <button
                    type="button"
                    onClick={() => onRejectCurrentPhase(caseItem.code)}
                    className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer"
                  >
                    ✕ Không duyệt (Tự END)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitSuperior(caseItem.code, editedMaterialsNote)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Duyệt & Gửi Báo Cáo Lên Superior</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Xem Báo Cáo Hiện Trường Đa Phương Tiện (Ảnh & Video) */}
      <FieldReportDetailModal
        isOpen={isFieldReportModalOpen}
        caseItem={caseItem}
        phase={currentPhase || null}
        onClose={() => setIsFieldReportModalOpen(false)}
      />
    </div>
  )
}
