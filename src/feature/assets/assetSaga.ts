import { all, call, put, takeLatest } from 'redux-saga/effects'
import type { PayloadAction } from '@reduxjs/toolkit'
import { toast } from 'sonner'
import assetAPI from './assetAPI'
import type { ImportResult } from '../../types/assets/import'
import type { SegmentListItemPagedResult } from '../../types/assets/segments'
import type { FeederListItemPagedResult } from '../../types/assets/feeders'
import type { PoleListItemPagedResult } from '../../types/assets/poles'
import {
  fetchAssetsRequest,
  fetchAssetsSuccess,
  fetchAssetsFailure,
  importAssetRequest,
  importAssetSuccess,
  importAssetFailure,
  type ImportAssetPayload,
} from './assetSlice'

/**
 * Worker saga tải toàn bộ danh mục tài sản thực tế từ Backend API
 */
function* handleFetchAssets() {
  try {
    const [segmentsRes, feedersRes, polesRes]: [
      SegmentListItemPagedResult,
      FeederListItemPagedResult,
      PoleListItemPagedResult
    ] = yield all([
      call(assetAPI.getSegments, { page_size: 1000 }),
      call(assetAPI.getFeeders, { page_size: 1000 }),
      call(assetAPI.getPoles, { page_size: 1000 }),
    ])

    yield put(
      fetchAssetsSuccess({
        segments: segmentsRes.items ?? [],
        cabinets: feedersRes.items ?? [],
        poles: polesRes.items ?? [],
      })
    )
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.message ||
      'Không thể tải dữ liệu danh mục tài sản từ máy chủ Backend.'
    yield put(fetchAssetsFailure(errorMsg))
    // Don't toast error on unauthenticated/initial load to avoid spamming toast
  }
}

/**
 * Worker saga nạp file CSV lên Backend API
 */
function* handleImportAsset(action: PayloadAction<ImportAssetPayload>) {
  const { category, file } = action.payload

  try {
    let result: ImportResult

    switch (category) {
      case 'segments':
        result = (yield call(assetAPI.importSegments, file)) as ImportResult
        break
      case 'cabinets':
        result = (yield call(assetAPI.importFeeders, file)) as ImportResult
        break
      case 'poles':
      case 'poles_and_fixtures':
        result = (yield call(assetAPI.importPoles, file)) as ImportResult
        break
      case 'fixtures':
        result = (yield call(assetAPI.importFixtures, file)) as ImportResult
        break
      default:
        throw new Error(`Loại tài sản '${category}' không được hỗ trợ để nạp tệp.`)
    }

    yield put(importAssetSuccess(result))

    const inserted = result.inserted ?? 0
    const updated = result.updated ?? 0

    // Tự động tải lại dữ liệu từ Backend để các bảng cập nhật ngay lập tức
    if (inserted + updated > 0) {
      yield put(fetchAssetsRequest())
    }
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.message ||
      'Không thể kết nối đến máy chủ Backend để nạp dữ liệu.'
    yield put(importAssetFailure(errorMsg))
    toast.error(`Lỗi nạp dữ liệu: ${errorMsg}`)
  }
}

export default function* assetSaga() {
  yield takeLatest(fetchAssetsRequest.type, handleFetchAssets)
  yield takeLatest(importAssetRequest.type, handleImportAsset)
}
