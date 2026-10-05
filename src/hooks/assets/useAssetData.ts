import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import type { RootState } from '../../redux/rootReducer'
import { fetchAssetsRequest } from '../../feature/assets/assetSlice'
import type { PoleListItem } from '../../types/assets/poles'
import type { FeederListItem } from '../../types/assets/feeders'
import type { SegmentListItem } from '../../types/assets/segments'
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
      .map((p) => ({
        ...(p.active_fixture as ActiveFixture),
        pole_id: p.pole_id,
        pole_external_ref: p.external_ref,
        removed_date: null,
      }))
  }, [poles])

  const showBanner = useCallback((msg: string) => {
    setSuccessBanner(msg)
    toast.success(msg)
    setTimeout(() => setSuccessBanner(null), 4000)
  }, [])

  // --- Pole Handlers ---
  const handleAddPole = (data: PoleListItem) => {
    handleAddPoles([data])
  }

  const handleAddPoles = (dataList: PoleListItem[]) => {
    if (!dataList || dataList.length === 0) return

    const targetSegmentId = dataList[0].segment_id

    setPoles((prev) => [...dataList, ...prev])

    // Update pole count for the segment
    if (targetSegmentId) {
      setSegments((prev) =>
        prev.map((s) =>
          s.segment_id === targetSegmentId
            ? { ...s, pole_count: (s.pole_count || 0) + dataList.length }
            : s
        )
      )
    }

    // Automatically update pole counts for affected feeders/cabinets
    setCabinets((prev) =>
      prev.map((cab) => {
        const addedForThisCab = dataList.filter((item) => item.feeder_id === cab.feeder_id).length
        return addedForThisCab > 0
          ? { ...cab, pole_count: (cab.pole_count || 0) + addedForThisCab }
          : cab
      })
    )

    if (dataList.length === 1) {
      showBanner(`Đã đăng ký thành công cột đèn "${dataList[0].pole_id}" vào Bản đồ GIS!`)
    } else {
      showBanner(`Đã đăng ký thành công ${dataList.length} cột đèn vào Bản đồ GIS!`)
    }
  }

  const handleUpdatePole = (updated: PoleListItem) => {
    setPoles((prev) =>
      prev.map((item) => (item.pole_id === updated.pole_id ? updated : item))
    )
    showBanner(`Đã cập nhật thông số và tọa độ cột đèn "${updated.pole_id}"!`)
  }

  // --- Fixture Handlers ---
  const handleAddFixture = (data: CreateFixtureRequest) => {
    const newActiveFixture: ActiveFixture = {
      fixture_id: `FIX-${Date.now().toString().slice(-4)}`,
      fixture_type: data.fixture_type,
      power_source: data.power_source,
      lamp_watt: data.lamp_watt,
      install_date: data.install_date,
      warranty_expiry: data.warranty_expiry,
      data_source: data.data_source,
    }

    // Attach to the pole directly
    setPoles((prev) =>
      prev.map((p) =>
        p.pole_id === data.pole_id
          ? { ...p, active_fixture: newActiveFixture }
          : p
      )
    )
    showBanner(`Đã thêm bóng đèn mới gắn vào cột "${data.pole_id}"!`)
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

  const handleRetireFixture = (fixtureId: string, req: RetireFixtureRequest) => {
    setPoles((prev) =>
      prev.map((p) => {
        if (p.active_fixture?.fixture_id === fixtureId) {
          if (req.removed_date) {
            // Retire / remove fixture from the pole
            return { ...p, active_fixture: undefined }
          }
        }
        return p
      })
    )
    showBanner(
      req.removed_date
        ? `Đã đăng ký tháo dỡ bóng đèn "${fixtureId}"!`
        : `Đã kích hoạt lại bóng đèn "${fixtureId}"!`
    )
  }

  // --- Cabinet / Feeder Handlers ---
  const handleAddCabinet = (data: FeederListItem) => {
    handleAddCabinets([data])
  }

  const handleAddCabinets = (newCabinetsList: FeederListItem[]) => {
    if (newCabinetsList.length === 0) return

    setCabinets((prev) => [...newCabinetsList, ...prev])
    showBanner(`Đã lưu thành công ${newCabinetsList.length} tủ điện vào Bản đồ GIS!`)
  }

  const handleUpdateCabinet = (updated: FeederListItem) => {
    setCabinets((prev) =>
      prev.map((item) => (item.feeder_id === updated.feeder_id ? updated : item))
    )
    showBanner(`Đã cập nhật thông số và tọa độ tủ điện "${updated.feeder_name || updated.feeder_id}"!`)
  }

  // --- Segment Handlers ---
  const handleAddSegment = (data: SegmentListItem) => {
    setSegments((prev) => [data, ...prev])
    showBanner(`Đã tạo tuyến đường mới "${data.segment_name}" thành công!`)
  }

  const handleUpdateSegment = (updated: SegmentListItem) => {
    setSegments((prev) =>
      prev.map((item) => (item.segment_id === updated.segment_id ? updated : item))
    )
    showBanner(`Đã cập nhật thông tin tuyến đường "${updated.segment_name}"!`)
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
