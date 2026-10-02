import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GOOGLE_HYBRID_STYLE, DEFAULT_MAP_CENTER } from '../utils/gis-map/mapUtils'
import {
  fetchRoadRoute,
  getPoleSpineWaypoints,
  snapPointToPolyline,
  computeLiveSnappedRoute,
} from '../utils/gis-map/routeUtils'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

export interface SegmentPoleItem {
  id: string
  code?: string
  coord: [number, number]
  status?: string
  atlas?: string
}

export interface SegmentRouteMapProps {
  coordinates?: [number, number][]
  originalRouteCoords?: [number, number][]
  startCoord?: [number, number] // [lng, lat]
  endCoord?: [number, number]   // [lng, lat]
  originalStartCoord?: [number, number]
  originalEndCoord?: [number, number]
  height?: string
  editable?: boolean
  onStartCoordChange?: (coord: [number, number]) => void
  onEndCoordChange?: (coord: [number, number]) => void
  onRouteCoordsChange?: (coords: [number, number][]) => void
  poles?: SegmentPoleItem[]
}

// Coordinate validator (checks if longitude and latitude are in valid range)
const isValidCoord = (c?: [number, number]): c is [number, number] => {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    c[0] > 50 &&
    c[0] < 180 &&
    c[1] > 0 &&
    c[1] < 90
  )
}

export const SegmentRouteMap: React.FC<SegmentRouteMapProps> = ({
  coordinates = [],
  originalRouteCoords,
  startCoord,
  endCoord,
  originalStartCoord,
  originalEndCoord,
  height = '240px',
  editable = false,
  onStartCoordChange,
  onEndCoordChange,
  onRouteCoordsChange,
  poles = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const startMarkerRef = useRef<maplibregl.Marker | null>(null)
  const endMarkerRef = useRef<maplibregl.Marker | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const currentCoordsRef = useRef<[number, number][]>([...coordinates])
  const stableBaseRouteRef = useRef<[number, number][]>([])
  const lastSnappedStartRef = useRef<[number, number] | null>(null)
  const lastSnappedEndRef = useRef<[number, number] | null>(null)
  const dragDebounceTimerRef = useRef<any>(null)

  // Persistent callback refs to prevent any map re-initialization / flickering
  const onStartCoordChangeRef = useRef(onStartCoordChange)
  onStartCoordChangeRef.current = onStartCoordChange

  const onEndCoordChangeRef = useRef(onEndCoordChange)
  onEndCoordChangeRef.current = onEndCoordChange

  const onRouteCoordsChangeRef = useRef(onRouteCoordsChange)
  onRouteCoordsChangeRef.current = onRouteCoordsChange

  const [pickMode, setPickMode] = useState<'none' | 'start' | 'end'>('none')
  const pickModeRef = useRef<'none' | 'start' | 'end'>('none')
  pickModeRef.current = pickMode

  // Round coordinate to 6 decimal places (~10cm precision)
  const roundCoord = (val: number) => Math.round(val * 1000000) / 1000000

  // Calculate route bounding box
  const getBounds = (coords?: [number, number][]): maplibregl.LngLatBoundsLike | null => {
    const pts: [number, number][] = []
    if (coords && coords.length > 0) {
      coords.forEach((pt) => {
        if (isValidCoord(pt)) pts.push(pt)
      })
    } else {
      const target = currentCoordsRef.current
      if (target && target.length > 0) {
        target.forEach((pt) => {
          if (isValidCoord(pt)) pts.push(pt)
        })
      }
      if (isValidCoord(startCoord)) pts.push(startCoord)
      if (isValidCoord(endCoord)) pts.push(endCoord)
    }

    if (poles && poles.length > 0) {
      poles.forEach((p) => {
        if (isValidCoord(p.coord)) pts.push(p.coord)
      })
    }

    if (pts.length === 0) return null

    let minLng = pts[0][0]
    let maxLng = pts[0][0]
    let minLat = pts[0][1]
    let maxLat = pts[0][1]

    pts.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })

    if (minLng === maxLng) {
      minLng -= 0.0015
      maxLng += 0.0015
    }
    if (minLat === maxLat) {
      minLat -= 0.0015
      maxLat += 0.0015
    }

    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ]
  }

  // Ordered sequence of segment poles along the baseline route (Spine Waypoints)
  const orderedPoleCoords = useMemo(() => {
    const validPoles = (poles || []).map((p) => p.coord).filter(isValidCoord)
    if (validPoles.length <= 1) return validPoles

    // Reference baseline polyline
    const refLine =
      currentCoordsRef.current.length >= 2
        ? currentCoordsRef.current
        : coordinates.length >= 2
        ? coordinates
        : [validPoles[0], validPoles[validPoles.length - 1]]

    return [...validPoles].sort((a, b) => {
      const snapA = snapPointToPolyline(a, refLine)
      const snapB = snapPointToPolyline(b, refLine)
      return snapA.accumulatedDist - snapB.accumulatedDist
    })
  }, [poles, coordinates])

  const orderedPoleCoordsRef = useRef<[number, number][]>(orderedPoleCoords)
  orderedPoleCoordsRef.current = orderedPoleCoords

  // Update line geometry source in MapLibre silently without re-renders
  const updateRouteLineSource = useCallback((newCoords: [number, number][]) => {
    currentCoordsRef.current = newCoords
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('route-line') as maplibregl.GeoJSONSource
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: newCoords.filter(isValidCoord),
        },
        properties: {},
      })
    }
  }, [])

  const abortControllerRef = useRef<AbortController | null>(null)

  // Asynchronously request real road route from OSRM strictly constrained through the poles chain
  const requestRoadRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      if (!isValidCoord(start) || !isValidCoord(end)) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        // Option 1: Use ordered poles as spine waypoints to strictly bind the route to the poles' street
        const spineWaypoints = getPoleSpineWaypoints(start, end, orderedPoleCoordsRef.current)
        const roadCoords = await fetchRoadRoute(start, end, controller.signal, spineWaypoints)
        if (controller.signal.aborted) return

        if (roadCoords && roadCoords.length >= 2) {
          updateRouteLineSource(roadCoords)
          onRouteCoordsChangeRef.current?.(roadCoords)
          stableBaseRouteRef.current = [...roadCoords]

          // Crucial: Automatically snap Start & End markers onto the real road endpoints computed by OSRM!
          const actualStart = roadCoords[0]
          const actualEnd = roadCoords[roadCoords.length - 1]

          if (!isDraggingRef.current) {
            if (startMarkerRef.current && isValidCoord(actualStart)) {
              startMarkerRef.current.setLngLat(actualStart)
              lastSnappedStartRef.current = actualStart
              onStartCoordChangeRef.current?.(actualStart)
            }
            if (endMarkerRef.current && isValidCoord(actualEnd)) {
              endMarkerRef.current.setLngLat(actualEnd)
              lastSnappedEndRef.current = actualEnd
              onEndCoordChangeRef.current?.(actualEnd)
            }
          }
        }
      } catch {
        // Safe fallback
      }
    },
    [updateRouteLineSource]
  )

  const requestRoadRouteRef = useRef(requestRoadRoute)
  requestRoadRouteRef.current = requestRoadRoute



  // Create Start or End Pin element (minimal sleek badge with needle anchor)
  const createTerminalPinElement = useCallback(
    (isStart: boolean, label: string) => {
      const el = document.createElement('div')
      el.className = 'segment-terminal-pin'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.pointerEvents = 'auto'
      el.style.zIndex = '40'
      el.style.cursor = editable ? 'move' : 'default'
      el.style.userSelect = 'none'

      const themeColor = isStart ? '#10b981' : '#f43f5e'

      el.innerHTML = `
        <div class="pin-badge" style="
          position: relative;
          display: flex;
          align-items: center;
          gap: 3.5px;
          padding: 2px 6px;
          background: ${themeColor};
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          font-family: inherit;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          transform: translateY(-2px);
          transition: transform 0.15s ease;
          letter-spacing: 0.2px;
          white-space: nowrap;
        ">
          <span style="display: inline-block; width: 4.5px; height: 4.5px; border-radius: 50%; background: #ffffff;"></span>
          <span>${label}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 3.5px solid transparent;
          border-right: 3.5px solid transparent;
          border-top: 5px solid ${themeColor};
          margin-top: -2px;
        "></div>
      `

      // Apply hover animation ONLY to the inner badge child, NEVER to outer el!
      if (editable) {
        const badge = el.querySelector('.pin-badge') as HTMLElement | null
        el.onmouseenter = () => {
          if (badge) {
            badge.style.transform = 'translateY(-3px) scale(1.05)'
          }
        }
        el.onmouseleave = () => {
          if (badge && !isDraggingRef.current) {
            badge.style.transform = 'translateY(-2px) scale(1)'
          }
        }
      }

      return el
    },
    [editable]
  )

  // INITIALIZE MAP ONCE: No dependencies on changing callbacks or parent states
  useEffect(() => {
    if (!containerRef.current) return

    currentCoordsRef.current = coordinates && coordinates.length > 0 ? [...coordinates] : []

    const validStart: [number, number] = isValidCoord(startCoord)
      ? startCoord
      : coordinates.find(isValidCoord) || DEFAULT_MAP_CENTER

    const validEnd: [number, number] = isValidCoord(endCoord)
      ? endCoord
      : [...coordinates].reverse().find(isValidCoord) || validStart

    const center: [number, number] = validStart

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GOOGLE_HYBRID_STYLE,
      center,
      zoom: 15,
      minZoom: 6,
      maxZoom: 20,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      // 1. Add Road Route Line
      const validPoints = currentCoordsRef.current.filter(isValidCoord)
      const dataCoords =
        validPoints.length > 1
          ? validPoints
          : [validStart, validEnd]

      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: dataCoords,
          },
          properties: {},
        },
      })

      // Road Surface Glow Layer
      map.addLayer({
        id: 'route-line-glow',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0284c7',
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 5, 16, 9],
          'line-opacity': 0.45,
          'line-blur': 2,
        },
      })

      // Road Surface Sharp Core Layer
      map.addLayer({
        id: 'route-line-core',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.8, 16, 4.5],
          'line-opacity': 0.95,
        },
      })

      // 2. Add Visual Poles Layer (Warm LED light dots)
      if (poles && poles.length > 0) {
        const poleFeatures = poles
          .filter((p) => isValidCoord(p.coord))
          .map((p) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: p.coord,
            },
            properties: {
              id: p.id,
              code: p.code || p.id,
              status: p.status || 'normal',
              atlas: p.atlas || '',
            },
          }))

        if (poleFeatures.length > 0) {
          map.addSource('segment-poles', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: poleFeatures,
            },
          })

          map.addLayer({
            id: 'segment-poles-core',
            type: 'circle',
            source: 'segment-poles',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.8, 16, 2.5],
              'circle-color': '#fde047',
              'circle-stroke-width': 1,
              'circle-stroke-color': '#0f172a',
              'circle-opacity': 0.85,
            },
          })
        }
      }

      // 3. Add Start & End Pins with needle anchor
      if (isValidCoord(validStart)) {
        const startEl = createTerminalPinElement(true, 'ĐẦU TUYẾN')
        const startMarker = new maplibregl.Marker({
          element: startEl,
          anchor: 'bottom',
          draggable: editable,
        })
          .setLngLat(validStart)
          .addTo(map)

        startMarkerRef.current = startMarker

        if (editable) {
          startMarker.on('dragstart', () => {
            isDraggingRef.current = true
            stableBaseRouteRef.current = [...currentCoordsRef.current]
            startEl.style.cursor = 'move'
            const badge = startEl.querySelector('.pin-badge') as HTMLElement | null
            if (badge) {
              badge.style.transform = 'translateY(-4px) scale(1.08)'
            }
          })

          startMarker.on('drag', () => {
            const pos = startMarker.getLngLat()
            const pt: [number, number] = [roundCoord(pos.lng), roundCoord(pos.lat)]
            const base = stableBaseRouteRef.current
            if (base.length === 0) return

            const { routeCoords, snappedPoint } = computeLiveSnappedRoute(base, pt, false)
            lastSnappedStartRef.current = snappedPoint
            updateRouteLineSource(routeCoords)

            if (dragDebounceTimerRef.current) {
              clearTimeout(dragDebounceTimerRef.current)
            }
            dragDebounceTimerRef.current = setTimeout(() => {
              const targetEnd: [number, number] = endMarkerRef.current
                ? [
                    roundCoord(endMarkerRef.current.getLngLat().lng),
                    roundCoord(endMarkerRef.current.getLngLat().lat),
                  ]
                : validEnd
              requestRoadRouteRef.current(pt, targetEnd)
            }, 350)
          })

          startMarker.on('dragend', () => {
            isDraggingRef.current = false
            if (dragDebounceTimerRef.current) {
              clearTimeout(dragDebounceTimerRef.current)
            }
            startEl.style.cursor = 'move'
            const badge = startEl.querySelector('.pin-badge') as HTMLElement | null
            if (badge) {
              badge.style.transform = 'translateY(-2px) scale(1)'
              badge.style.filter = 'none'
            }
            const pos = startMarker.getLngLat()
            const pt: [number, number] = [roundCoord(pos.lng), roundCoord(pos.lat)]
            const finalPt = lastSnappedStartRef.current || pt

            // Snap marker itself onto the road centerline
            startMarker.setLngLat(finalPt)
            onStartCoordChangeRef.current?.(finalPt)
            onRouteCoordsChangeRef.current?.(currentCoordsRef.current)

            const targetEnd: [number, number] = endMarkerRef.current
              ? [
                  roundCoord(endMarkerRef.current.getLngLat().lng),
                  roundCoord(endMarkerRef.current.getLngLat().lat),
                ]
              : validEnd

            requestRoadRouteRef.current(finalPt, targetEnd)
          })
        }
      }

      if (isValidCoord(validEnd)) {
        const endEl = createTerminalPinElement(false, 'CUỐI TUYẾN')
        const endMarker = new maplibregl.Marker({
          element: endEl,
          anchor: 'bottom',
          draggable: editable,
        })
          .setLngLat(validEnd)
          .addTo(map)

        endMarkerRef.current = endMarker

        if (editable) {
          endMarker.on('dragstart', () => {
            isDraggingRef.current = true
            stableBaseRouteRef.current = [...currentCoordsRef.current]
            endEl.style.cursor = 'move'
            const badge = endEl.querySelector('.pin-badge') as HTMLElement | null
            if (badge) {
              badge.style.transform = 'translateY(-4px) scale(1.08)'
            }
          })

          endMarker.on('drag', () => {
            const pos = endMarker.getLngLat()
            const pt: [number, number] = [roundCoord(pos.lng), roundCoord(pos.lat)]
            const base = stableBaseRouteRef.current
            if (base.length === 0) return

            const { routeCoords, snappedPoint } = computeLiveSnappedRoute(base, pt, true)
            lastSnappedEndRef.current = snappedPoint
            updateRouteLineSource(routeCoords)

            if (dragDebounceTimerRef.current) {
              clearTimeout(dragDebounceTimerRef.current)
            }
            dragDebounceTimerRef.current = setTimeout(() => {
              const targetStart: [number, number] = startMarkerRef.current
                ? [
                    roundCoord(startMarkerRef.current.getLngLat().lng),
                    roundCoord(startMarkerRef.current.getLngLat().lat),
                  ]
                : validStart
              requestRoadRouteRef.current(targetStart, pt)
            }, 350)
          })

          endMarker.on('dragend', () => {
            isDraggingRef.current = false
            if (dragDebounceTimerRef.current) {
              clearTimeout(dragDebounceTimerRef.current)
            }
            endEl.style.cursor = 'move'
            const badge = endEl.querySelector('.pin-badge') as HTMLElement | null
            if (badge) {
              badge.style.transform = 'translateY(-2px) scale(1)'
              badge.style.filter = 'none'
            }
            const pos = endMarker.getLngLat()
            const pt: [number, number] = [roundCoord(pos.lng), roundCoord(pos.lat)]
            const finalPt = lastSnappedEndRef.current || pt

            // Snap marker itself onto the road centerline
            endMarker.setLngLat(finalPt)
            onEndCoordChangeRef.current?.(finalPt)
            onRouteCoordsChangeRef.current?.(currentCoordsRef.current)

            const targetStart: [number, number] = startMarkerRef.current
              ? [
                  roundCoord(startMarkerRef.current.getLngLat().lng),
                  roundCoord(startMarkerRef.current.getLngLat().lat),
                ]
              : validStart

            requestRoadRouteRef.current(targetStart, finalPt)
          })
        }
      }

      // Map click handler for Click-to-pick mode
      if (editable) {
        map.on('click', (e: maplibregl.MapMouseEvent) => {
          const currentPick = pickModeRef.current
          if (currentPick === 'none') return

          const newPt: [number, number] = [roundCoord(e.lngLat.lng), roundCoord(e.lngLat.lat)]

          if (currentPick === 'start') {
            const base = currentCoordsRef.current
            const { routeCoords, snappedPoint } = computeLiveSnappedRoute(base, newPt, false)
            startMarkerRef.current?.setLngLat(snappedPoint)
            onStartCoordChangeRef.current?.(snappedPoint)
            updateRouteLineSource(routeCoords)
            onRouteCoordsChangeRef.current?.(routeCoords)

            const targetEnd: [number, number] = endMarkerRef.current
              ? [
                  roundCoord(endMarkerRef.current.getLngLat().lng),
                  roundCoord(endMarkerRef.current.getLngLat().lat),
                ]
              : validEnd
            requestRoadRouteRef.current(snappedPoint, targetEnd)
            setPickMode('none')
          } else if (currentPick === 'end') {
            const base = currentCoordsRef.current
            const { routeCoords, snappedPoint } = computeLiveSnappedRoute(base, newPt, true)
            endMarkerRef.current?.setLngLat(snappedPoint)
            onEndCoordChangeRef.current?.(snappedPoint)
            updateRouteLineSource(routeCoords)
            onRouteCoordsChangeRef.current?.(routeCoords)

            const targetStart: [number, number] = startMarkerRef.current
              ? [
                  roundCoord(startMarkerRef.current.getLngLat().lng),
                  roundCoord(startMarkerRef.current.getLngLat().lat),
                ]
              : validStart
            requestRoadRouteRef.current(targetStart, snappedPoint)
            setPickMode('none')
          }
        })
      }

      // Fit bounds nicely
      const b = getBounds()
      if (b) {
        map.fitBounds(b, { padding: 40, duration: 400, maxZoom: 17 })
      }
    })

    // Resize handling for modal transition
    const resizeTimer = setTimeout(() => {
      map.resize()
      const b = getBounds()
      if (b) {
        map.fitBounds(b, { padding: 40, duration: 0, maxZoom: 17 })
      }
    }, 220)

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      if (dragDebounceTimerRef.current) {
        clearTimeout(dragDebounceTimerRef.current)
      }
      abortControllerRef.current?.abort()
      startMarkerRef.current?.remove()
      endMarkerRef.current?.remove()
      startMarkerRef.current = null
      endMarkerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [editable, createTerminalPinElement, updateRouteLineSource])

  // Sync cursor when pickMode changes
  useEffect(() => {
    if (!mapRef.current) return
    const canvas = mapRef.current.getCanvas()
    if (pickMode === 'start' || pickMode === 'end') {
      canvas.style.cursor = 'crosshair'
    } else {
      canvas.style.cursor = ''
    }
  }, [pickMode])

  // Sync external startCoord changes (e.g. typing in input fields)
  useEffect(() => {
    if (isDraggingRef.current || !startCoord || !isValidCoord(startCoord)) return
    if (!mapRef.current || !startMarkerRef.current) return

    const currentPos = startMarkerRef.current.getLngLat()
    const diffLng = Math.abs(currentPos.lng - startCoord[0])
    const diffLat = Math.abs(currentPos.lat - startCoord[1])

    if (diffLng > 0.00001 || diffLat > 0.00001) {
      startMarkerRef.current.setLngLat(startCoord)
    }
  }, [startCoord])

  // Sync external endCoord changes (e.g. typing in input fields)
  useEffect(() => {
    if (isDraggingRef.current || !endCoord || !isValidCoord(endCoord)) return
    if (!mapRef.current || !endMarkerRef.current) return

    const currentPos = endMarkerRef.current.getLngLat()
    const diffLng = Math.abs(currentPos.lng - endCoord[0])
    const diffLat = Math.abs(currentPos.lat - endCoord[1])

    if (diffLng > 0.00001 || diffLat > 0.00001) {
      endMarkerRef.current.setLngLat(endCoord)
    }
  }, [endCoord])

  // Sync external coordinates changes (e.g. when reset or updated from outside)
  useEffect(() => {
    if (isDraggingRef.current) return
    if (!coordinates || coordinates.length === 0) return
    if (coordinates === currentCoordsRef.current) return

    updateRouteLineSource(coordinates)
    stableBaseRouteRef.current = [...coordinates]
  }, [coordinates, updateRouteLineSource])

  // Controls Handlers
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 250 })
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 250 })
  const handleFitBounds = () => {
    const bounds = getBounds()
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 400, maxZoom: 17 })
    }
  }

  // Reset to original coordinates and route
  const handleReset = () => {
    if (!originalStartCoord || !originalEndCoord) return

    // Cancel any pending live-routing debounce or active fetch
    if (dragDebounceTimerRef.current) {
      clearTimeout(dragDebounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (startMarkerRef.current && isValidCoord(originalStartCoord)) {
      startMarkerRef.current.setLngLat(originalStartCoord)
    }
    if (endMarkerRef.current && isValidCoord(originalEndCoord)) {
      endMarkerRef.current.setLngLat(originalEndCoord)
    }

    lastSnappedStartRef.current = originalStartCoord
    lastSnappedEndRef.current = originalEndCoord

    const targetRoute =
      originalRouteCoords && originalRouteCoords.length > 0
        ? originalRouteCoords
        : [originalStartCoord, originalEndCoord]

    stableBaseRouteRef.current = [...targetRoute]
    updateRouteLineSource(targetRoute)
    onRouteCoordsChangeRef.current?.(targetRoute)

    onStartCoordChangeRef.current?.(originalStartCoord)
    onEndCoordChangeRef.current?.(originalEndCoord)
    setPickMode('none')

    const bounds = getBounds(targetRoute)
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 400, maxZoom: 17 })
    }
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group">
      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="w-full bg-slate-900"
      />

      {/* Editable Pick Mode Selector (Top Left) */}
      {editable && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-xs">
          <button
            type="button"
            onClick={() => setPickMode(pickMode === 'start' ? 'none' : 'start')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
              pickMode === 'start'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
            title="Click vào bản đồ để chọn lại vị trí Điểm đầu"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{pickMode === 'start' ? 'Click Đặt Điểm Đầu...' : 'Chấm Điểm Đầu'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPickMode(pickMode === 'end' ? 'none' : 'end')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
              pickMode === 'end'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-400 hover:bg-slate-800'
            }`}
            title="Click vào bản đồ để chọn lại vị trí Điểm cuối"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>{pickMode === 'end' ? 'Click Đặt Điểm Cuối...' : 'Chấm Điểm Cuối'}</span>
          </button>
        </div>
      )}

      {/* Floating Control Buttons (Top Right) */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Phóng to"
          className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Thu nhỏ"
          className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleFitBounds}
          title="Bao quát toàn tuyến"
          className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {editable && originalStartCoord && originalEndCoord && (
          <button
            type="button"
            onClick={handleReset}
            title="Khôi phục lại tuyến đường ban đầu"
            className="w-7 h-7 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
export default SegmentRouteMap
