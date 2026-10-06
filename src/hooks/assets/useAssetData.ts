import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import type { RootState } from '../../redux/rootReducer'
import { fetchAssetsRequest } from '../../feature/assets/assetSlice'
import { assetAPI } from '../../feature/assets/assetAPI'
import type { PoleListItem, CreatePoleRequest, UpdatePoleRequest } from '../../types/assets/poles'
import type { FeederListItem, CreateFeederRequest, UpdateFeederRequest } from '../../types/assets/feeders'
import type { SegmentListItem, CreateSegmentRequest, UpdateSegmentRequest } from '../../types/assets/segments'
import type { ActiveFixture, CreateFixtureRequest, RetireFixtureRequest } from '../../types/assets/fixtures'

// ManagedFixture represents an active or historical fixture displayed in the fixtures table
export type ManagedFixture = ActiveFixture & {
  pole_id?: string | null
  pole_external_ref?: string | null
  removed_date?: string | null
}

export function useAssetData() {
  const dispatch = useDispatch()
  const {
    poles: backendPoles,
    cabinets: backendCabinets,
    segments: backendSegments,
    isLoadingAssets,
    loadAssetsError,
  } = useSelector((state: RootState) => state.assets)

  const [poles, setPoles] = useState<PoleListItem[]>([])
  const [cabinets, setCabinets] = useState<FeederListItem[]>([])
  const [segments, setSegments] = useState<SegmentListItem[]>([])
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // Fetch real assets from Backend API on mount
  useEffect(() => {
    dispatch(fetchAssetsRequest())
  }, [dispatch])

  // Synchronize local table state when Backend data arrives
  useEffect(() => {
    if (backendPoles) {
      setPoles(backendPoles)
    }
  }, [backendPoles])

  useEffect(() => {
    if (backendCabinets) {
      setCabinets(backendCabinets)
    }
  }, [backendCabinets])

  useEffect(() => {
    if (backendSegments) {
      setSegments(backendSegments)
    }
  }, [backendSegments])

  // Fixtures are derived dynamically from poles carrying an active lamp
  const fixtures: ManagedFixture[] = useMemo(() => {
    return poles
      .filter((p) => p.active_fixture)
      .map((p) => {
        const fixtureId =
          p.active_fixture?.fixture_id ||
          (p.external_ref ? `FIX-${p.external_ref}` : null)
        return {
          ...(p.active_fixture as ActiveFixture),
          fixture_id: fixtureId,
          pole_external_ref: p.external_ref,
          removed_date: null,
        }
      })
  }, [poles])

  const showBanner = useCallback((msg: string) => {
    setSuccessBanner(msg)
    toast.success(msg)
    setTimeout(() => setSuccessBanner(null), 4000)
  }, [])

  // --- Pole Handlers ---
  const handleAddPole = async (data: PoleListItem) => {
    await handleAddPoles([data])
  }

  const handleAddPoles = async (dataList: PoleListItem[]) => {
    if (!dataList || dataList.length === 0) return

    try {
      for (const item of dataList) {
        const createReq: CreatePoleRequest = {
          external_ref: item.external_ref || item.pole_id || null,
          segment_id: item.segment_id || null,
          feeder_id: item.feeder_id || null,
          commune_id: item.commune_id || null,
          geom_wkt: item.location ? `POINT(${item.location.lng} ${item.location.lat})` : null,
          near_sensitive_poi: !!item.near_sensitive_poi,
          data_source: item.data_source || 'field',
          note: item.note ?? null,
        }
        await assetAPI.createPole(createReq)

        // Nếu có fixture đính kèm thì đăng ký fixture cho cột
        if (item.active_fixture && item.pole_id) {
          const fixtureReq: CreateFixtureRequest = {
            pole_id: item.pole_id,
            fixture_type: item.active_fixture.fixture_type || 'led_road_lamp',
            power_source: item.active_fixture.power_source || 'grid',
            lamp_watt: Number(item.active_fixture.lamp_watt) || 100,
            install_date: item.active_fixture.install_date || new Date().toISOString().split('T')[0],
            warranty_expiry: item.active_fixture.warranty_expiry || null,
            data_source: item.active_fixture.data_source || 'field',
          }
          await assetAPI.createFixture(fixtureReq)
        }
      }

      dispatch(fetchAssetsRequest())

      if (dataList.length === 1) {
        showBanner(`Đã lưu thành công cột đèn "${dataList[0].external_ref || dataList[0].pole_id}" vào Hệ thống!`)
      } else {
        showBanner(`Đã lưu thành công ${dataList.length} cột đèn vào Hệ thống!`)
      }
    } catch (err: any) {
      console.error('Failed to create pole(s):', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu cột đèn vào hệ thống'
      toast.error(`Lỗi khi tạo cột: ${errorMsg}`)
    }
  }

  const handleUpdatePole = async (updated: PoleListItem) => {
    if (!updated.pole_id) {
      toast.error('Thiếu mã định danh cột để cập nhật!')
      return
    }

    try {
      const updateReq: UpdatePoleRequest = {
        external_ref: updated.external_ref || updated.pole_id,
        segment_id: updated.segment_id || null,
        feeder_id: updated.feeder_id || null,
        geom_wkt: updated.location ? `POINT(${updated.location.lng} ${updated.location.lat})` : null,
        near_sensitive_poi: !!updated.near_sensitive_poi,
        data_source: updated.data_source || 'field',
        note: updated.note ?? null,
      }

      await assetAPI.updatePole(updated.pole_id, updateReq)
      dispatch(fetchAssetsRequest())

      showBanner(`Đã cập nhật thông số cột đèn "${updated.external_ref || updated.pole_id}"!`)
    } catch (err: any) {
      console.error('Failed to update pole:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật cột đèn'
      toast.error(`Lỗi khi cập nhật cột: ${errorMsg}`)
    }
  }

  // --- Fixture Handlers ---
  const handleAddFixture = async (data: CreateFixtureRequest) => {
    try {
      await assetAPI.createFixture(data)
      dispatch(fetchAssetsRequest())
      showBanner(`Đã thêm bóng đèn mới gắn vào cột "${data.pole_id}"!`)
    } catch (err: any) {
      console.error('Failed to create fixture:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm bóng đèn'
      toast.error(`Lỗi khi thêm bóng đèn: ${errorMsg}`)
    }
  }

  const handleUpdateFixture = (updated: ManagedFixture) => {
    setPoles((prev) =>
      prev.map((p) => {
        if (p.pole_id === updated.pole_id && p.active_fixture) {
          return {
            ...p,
            active_fixture: {
              ...p.active_fixture,
              ...updated,
            },
          }
        }
        return p
      })
    )
    showBanner(`Đã cập nhật thông số bóng đèn "${updated.fixture_id}"!`)
  }

  const handleRetireFixture = async (fixtureId: string, req: RetireFixtureRequest) => {
    try {
      await assetAPI.retireFixture(fixtureId, req)
      dispatch(fetchAssetsRequest())
      showBanner(
        req.removed_date
          ? `Đã đăng ký tháo dỡ bóng đèn "${fixtureId}"!`
          : `Đã kích hoạt lại bóng đèn "${fixtureId}"!`
      )
    } catch (err: any) {
      console.error('Failed to retire fixture:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thao tác bóng đèn'
      toast.error(`Lỗi thao tác bóng đèn: ${errorMsg}`)
    }
  }

  // --- Cabinet / Feeder Handlers ---
  const handleAddCabinet = async (data: FeederListItem) => {
    await handleAddCabinets([data])
  }

  const handleAddCabinets = async (newCabinetsList: FeederListItem[]) => {
    if (!newCabinetsList || newCabinetsList.length === 0) return

    try {
      for (const item of newCabinetsList) {
        const createReq: CreateFeederRequest = {
          external_ref: item.external_ref || item.feeder_id || null,
          feeder_name: item.feeder_name || item.feeder_id || 'Tủ điện mới',
          commune_id: item.commune_id || 'COM-001',
          geom_wkt: (item as any).location
            ? `POINT(${(item as any).location.lng} ${(item as any).location.lat})`
            : null,
        }
        await assetAPI.createFeeder(createReq)
      }

      dispatch(fetchAssetsRequest())

      if (newCabinetsList.length === 1) {
        showBanner(`Đã lưu thành công tủ điện "${newCabinetsList[0].feeder_name || newCabinetsList[0].feeder_id}" vào Hệ thống!`)
      } else {
        showBanner(`Đã lưu thành công ${newCabinetsList.length} tủ điện vào Hệ thống!`)
      }
    } catch (err: any) {
      console.error('Failed to create cabinet(s):', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu tủ điện vào hệ thống'
      toast.error(`Lỗi khi tạo tủ điện: ${errorMsg}`)
    }
  }

  const handleUpdateCabinet = async (updated: FeederListItem) => {
    if (!updated.feeder_id) {
      toast.error('Thiếu mã định danh tủ điện để cập nhật!')
      return
    }

    try {
      const updateReq: UpdateFeederRequest = {
        external_ref: updated.external_ref || updated.feeder_id,
        feeder_name: updated.feeder_name || updated.feeder_id,
        geom_wkt: (updated as any).location
          ? `POINT(${(updated as any).location.lng} ${(updated as any).location.lat})`
          : null,
      }

      await assetAPI.updateFeeder(updated.feeder_id, updateReq)
      dispatch(fetchAssetsRequest())

      showBanner(`Đã cập nhật thông số tủ điện "${updated.feeder_name || updated.feeder_id}"!`)
    } catch (err: any) {
      console.error('Failed to update cabinet:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật tủ điện'
      toast.error(`Lỗi khi cập nhật tủ điện: ${errorMsg}`)
    }
  }

  // --- Segment Handlers ---
  const handleAddSegment = async (data: SegmentListItem) => {
    try {
      const createReq: CreateSegmentRequest = {
        external_ref: data.external_ref || data.segment_id || null,
        segment_name: data.segment_name || 'Tuyến đường mới',
        road_class: data.road_class || 'inter_commune',
        length_m: Number(data.length_m) || 0,
        commune_id: data.commune_id || 'COM-001',
        geom_wkt: (data as any).geom_wkt || 'LINESTRING(106.5 10.9, 106.51 10.91)',
        data_source: data.data_source || 'field',
      }

      await assetAPI.createSegment(createReq)
      dispatch(fetchAssetsRequest())

      showBanner(`Đã tạo tuyến đường mới "${data.segment_name}" thành công!`)
    } catch (err: any) {
      console.error('Failed to create segment:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo tuyến đường'
      toast.error(`Lỗi khi tạo tuyến đường: ${errorMsg}`)
    }
  }

  const handleUpdateSegment = async (updated: SegmentListItem) => {
    if (!updated.segment_id) {
      toast.error('Thiếu mã định danh tuyến đường để cập nhật!')
      return
    }

    try {
      const updateReq: UpdateSegmentRequest = {
        external_ref: updated.external_ref || updated.segment_id,
        segment_name: updated.segment_name,
        road_class: updated.road_class || 'inter_commune',
        length_m: Number(updated.length_m) || 0,
        geom_wkt: (updated as any).geom_wkt || null,
        data_source: updated.data_source || 'field',
      }

      await assetAPI.updateSegment(updated.segment_id, updateReq)
      dispatch(fetchAssetsRequest())

      showBanner(`Đã cập nhật thông tin tuyến đường "${updated.segment_name}"!`)
    } catch (err: any) {
      console.error('Failed to update segment:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật tuyến đường'
      toast.error(`Lỗi khi cập nhật tuyến đường: ${errorMsg}`)
    }
  }

  // --- Import Handler ---
  const handleImportSuccess = useCallback(
    (
      count: number,
      _newPoles?: PoleListItem[],
      _importedFixtures?: ManagedFixture[]
    ) => {
      // Khi người dùng bấm hoàn tất đóng modal, hiển thị 1 toast duy nhất xác nhận dữ liệu đã sẵn sàng
      toast.success(`Đã đồng bộ thành công ${count} tài sản vào Hệ thống! Dữ liệu mới đã sẵn sàng.`)
    },
    []
  )

  return {
    poles,
    fixtures,
    cabinets,
    segments,
    isLoadingAssets,
    loadAssetsError,
    successBanner,
    handleAddPole,
    handleAddPoles,
    handleUpdatePole,
    handleAddFixture,
    handleUpdateFixture,
    handleRetireFixture,
    handleAddCabinet,
    handleAddCabinets,
    handleUpdateCabinet,
    handleAddSegment,
    handleUpdateSegment,
    handleImportSuccess,
  }
}
