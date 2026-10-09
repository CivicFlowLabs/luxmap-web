import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ImportResult } from '../../types/assets/import'
import type { ImportAssetCategory } from './assetAPI'
import type { PoleListItem } from '../../types/assets/poles'
import type { CabinetListItem } from '../../types/assets/cabinets'
import type { SegmentListItem } from '../../types/assets/segments'

export interface AssetState {
  // Asset Collections from Backend API
  poles: PoleListItem[]
  cabinets: CabinetListItem[]
  segments: SegmentListItem[]
  isLoadingAssets: boolean
  loadAssetsError: string | null

  // Import State
  isImporting: boolean
  importResult: ImportResult | null
  error: string | null
}

const initialState: AssetState = {
  poles: [],
  cabinets: [],
  segments: [],
  isLoadingAssets: false,
  loadAssetsError: null,

  isImporting: false,
  importResult: null,
  error: null,
}

export interface ImportAssetPayload {
  category: ImportAssetCategory
  file: File
}

export interface FetchAssetsSuccessPayload {
  poles: PoleListItem[]
  cabinets: CabinetListItem[]
  segments: SegmentListItem[]
}

const assetSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    // --- Fetch Real Assets from Backend ---
    fetchAssetsRequest: (state) => {
      state.isLoadingAssets = true
      state.loadAssetsError = null
    },
    fetchAssetsSuccess: (state, action: PayloadAction<FetchAssetsSuccessPayload>) => {
      state.isLoadingAssets = false
      state.poles = action.payload.poles
      state.cabinets = action.payload.cabinets
      state.segments = action.payload.segments
      state.loadAssetsError = null
    },
    fetchAssetsFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingAssets = false
      state.loadAssetsError = action.payload
    },

    // --- Import Actions ---
    importAssetRequest: (state, _action: PayloadAction<ImportAssetPayload>) => {
      state.isImporting = true
      state.importResult = null
      state.error = null
    },
    importAssetSuccess: (state, action: PayloadAction<ImportResult>) => {
      state.isImporting = false
      state.importResult = action.payload
      state.error = null
    },
    importAssetFailure: (state, action: PayloadAction<string>) => {
      state.isImporting = false
      state.error = action.payload
    },
    resetImportState: (state) => {
      state.isImporting = false
      state.importResult = null
      state.error = null
    },
  },
})

export const {
  fetchAssetsRequest,
  fetchAssetsSuccess,
  fetchAssetsFailure,
  importAssetRequest,
  importAssetSuccess,
  importAssetFailure,
  resetImportState,
} = assetSlice.actions

export type { ImportAssetCategory }
export default assetSlice.reducer
