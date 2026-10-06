import React, { useState } from 'react'
import {
  CheckCircle,
  Boxes,
  Zap,
  Route,
  Lightbulb,
} from 'lucide-react'
import { PolesTab } from './components/poles/PolesTab'
import { FixturesTab } from './components/fixtures/FixturesTab'
import { CabinetsTab } from './components/cabinets/CabinetsTab'
import { SegmentsTab } from './components/segments/SegmentsTab'
import { ImportAssetModal } from './components/ImportAssetModal'
import { useAssetData } from '../../hooks/assets/useAssetData'

export type AssetCategory = 'poles' | 'fixtures' | 'cabinets' | 'segments' | 'poles_and_fixtures'

export const AssetManagementPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('poles')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedFixtureCode, setSelectedFixtureCode] = useState<string>('')

  const handleSelectFixture = (fixtureCode: string) => {
    setSelectedFixtureCode(fixtureCode)
    setActiveCategory('fixtures')
  }

  const {
    poles,
    fixtures,
    cabinets,
    segments,
    successBanner,
    handleAddPole,
    handleAddPoles,
    handleUpdatePole,
    handleAddFixture,
    handleUpdateFixture,
    handleAddCabinet,
    handleAddCabinets,
    handleUpdateCabinet,
    handleAddSegment,
    handleUpdateSegment,
    handleImportSuccess,
  } = useAssetData()

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Scrollable Container */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {/* Top Notification Banner */}
        {successBanner && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-md font-bold">
              Hệ thống GIS
            </span>
          </div>
        )}

        {/* Segmented Control Navigation Tabs - Silky Sliding Active Pill */}
        <div className="relative grid grid-cols-4 bg-slate-100/85 dark:bg-slate-900/85 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] select-none">
          {/* Animated Sliding Active Pill */}
          <div
            className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_-1px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] border border-slate-200/80 dark:border-slate-700/80 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: 'calc((100% - 12px) / 4)',
              transform: `translateX(calc(${
                activeCategory === 'poles' || activeCategory === 'poles_and_fixtures'
                  ? 0
                  : activeCategory === 'fixtures'
                  ? 100
                  : activeCategory === 'cabinets' || (activeCategory as string) === 'feeders'
                  ? 200
                  : 300
              }%))`,
            }}
          />

          {/* Tab 1: Cột điện */}
          <button
            type="button"
            onClick={() => {
              setSelectedFixtureCode('')
              setActiveCategory('poles')
            }}
            className={`relative z-10 py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 ${
              activeCategory === 'poles' || activeCategory === 'poles_and_fixtures'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Boxes
              className={`w-4 h-4 transition-all duration-300 ${
                activeCategory === 'poles' || activeCategory === 'poles_and_fixtures'
                  ? 'text-blue-600 dark:text-blue-400 scale-110 drop-shadow-[0_1px_2px_rgba(37,99,235,0.3)]'
                  : 'text-slate-400'
              }`}
            />
            <span>Cột điện</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                activeCategory === 'poles' || activeCategory === 'poles_and_fixtures'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {poles.length}
            </span>
          </button>

          {/* Tab 2: Bóng đèn */}
          <button
            type="button"
            onClick={() => {
              setSelectedFixtureCode('')
              setActiveCategory('fixtures')
            }}
            className={`relative z-10 py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 ${
              activeCategory === 'fixtures'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Lightbulb
              className={`w-4 h-4 transition-all duration-300 ${
                activeCategory === 'fixtures'
                  ? 'text-amber-500 dark:text-amber-400 scale-110 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400'
              }`}
            />
            <span>Bóng đèn</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                activeCategory === 'fixtures'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {fixtures.length}
            </span>
          </button>

          {/* Tab 3: Tủ điện & Mạch nguồn (Feeder) */}
          <button
            type="button"
            onClick={() => {
              setSelectedFixtureCode('')
              setActiveCategory('cabinets')
            }}
            className={`relative z-10 py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 ${
              activeCategory === 'cabinets' || (activeCategory as string) === 'feeders'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Zap
              className={`w-4 h-4 transition-all duration-300 ${
                activeCategory === 'cabinets' || (activeCategory as string) === 'feeders'
                  ? 'text-amber-500 dark:text-amber-400 scale-110 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400'
              }`}
            />
            <span>Tủ điện & Lộ nguồn</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                activeCategory === 'cabinets' || (activeCategory as string) === 'feeders'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cabinets.length}
            </span>
          </button>

          {/* Tab 4: Tuyến đường chiếu sáng */}
          <button
            type="button"
            onClick={() => {
              setSelectedFixtureCode('')
              setActiveCategory('segments')
            }}
            className={`relative z-10 py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 ${
              activeCategory === 'segments'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <Route
              className={`w-4 h-4 transition-all duration-300 ${
                activeCategory === 'segments'
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110 drop-shadow-[0_1px_2px_rgba(79,70,229,0.3)]'
                  : 'text-slate-400'
              }`}
            />
            <span>Tuyến đường chiếu sáng</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                activeCategory === 'segments'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {segments.length}
            </span>
          </button>
        </div>

        {/* Tab 1 Content: Cột điện */}
        {(activeCategory === 'poles' || activeCategory === 'poles_and_fixtures') && (
          <PolesTab
            poles={poles}
            cabinets={cabinets}
            segments={segments}
            onAddPole={handleAddPole}
            onAddPoles={handleAddPoles}
            onUpdatePole={handleUpdatePole}
            onOpenImport={() => setIsImportModalOpen(true)}
            onViewCabinetDetail={() => {
              setActiveCategory('cabinets')
            }}
            onSelectFixture={handleSelectFixture}
          />
        )}

        {/* Tab 2 Content: Bóng đèn */}
        {activeCategory === 'fixtures' && (
          <FixturesTab
            fixtures={fixtures}
            poles={poles}
            activeFixtureCode={selectedFixtureCode}
            onClearActiveFixture={() => setSelectedFixtureCode('')}
            onAddFixture={handleAddFixture}
            onUpdateFixture={handleUpdateFixture}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {/* Tab 3 Content: Tủ điện & Mạch nguồn (Feeder) */}
        {(activeCategory === 'cabinets' || (activeCategory as string) === 'feeders') && (
          <CabinetsTab
            cabinets={cabinets}
            segments={segments}
            onAddCabinet={handleAddCabinet}
            onAddCabinets={handleAddCabinets}
            onUpdateCabinet={handleUpdateCabinet}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {/* Tab 4 Content: Tuyến đường chiếu sáng */}
        {activeCategory === 'segments' && (
          <SegmentsTab
            segments={segments}
            onAddSegment={handleAddSegment}
            onUpdateSegment={handleUpdateSegment}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}
      </div>

      {/* Global Import Modal */}
      <ImportAssetModal
        isOpen={isImportModalOpen}
        category={activeCategory}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}

export default AssetManagementPage
