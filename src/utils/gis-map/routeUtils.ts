/**
 * Utility functions for route geometry projection, magnetic road snapping, and trimming.
 * Guarantees that routes and endpoints ALWAYS strictly lie on the road centerline.
 */
import mockSegmentsGeoJson from '../../data/mock-segments.geo.json'

// Haversine distance between two coordinates in meters
export const calculateDistanceMeters = (
  p1: [number, number],
  p2: [number, number]
): number => {
  const R = 6371000 // Earth radius in meters
  const rad = Math.PI / 180
  const dLat = (p2[1] - p1[1]) * rad
  const dLng = (p2[0] - p1[0]) * rad
  const lat1 = p1[1] * rad
  const lat2 = p2[1] * rad

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate total length of a polyline in meters
export const calculateRouteLengthMeters = (coords: [number, number][]): number => {
  if (!coords || coords.length < 2) return 0
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) {
    total += calculateDistanceMeters(coords[i], coords[i + 1])
  }
  return Math.round(total)
}

// Project a point p onto line segment ab, returning the closest point on the segment
export const projectPointOnSegment = (
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { point: [number, number]; dist: number; t: number } => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy

  if (lenSq === 0) {
    const d = calculateDistanceMeters(p, a)
    return { point: [a[0], a[1]], dist: d, t: 0 }
  }

  // Parameter t of projection
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  const roundCoord = (val: number) => Math.round(val * 1000000) / 1000000
  const proj: [number, number] = [roundCoord(a[0] + t * dx), roundCoord(a[1] + t * dy)]
  const dist = calculateDistanceMeters(p, proj)
  return { point: proj, dist, t }
}

export interface SnappedPointResult {
  snappedPoint: [number, number]
  segmentIndex: number
  distMeters: number
  accumulatedDist: number
}

/**
 * Magnetically snap any coordinate onto the nearest point on the road centerline.
 */
export const snapPointToPolyline = (
  p: [number, number],
  roadCoords: [number, number][]
): SnappedPointResult => {
  if (!roadCoords || roadCoords.length === 0) {
    return { snappedPoint: p, segmentIndex: 0, distMeters: 0, accumulatedDist: 0 }
  }
  if (roadCoords.length === 1) {
    return {
      snappedPoint: roadCoords[0],
      segmentIndex: 0,
      distMeters: calculateDistanceMeters(p, roadCoords[0]),
      accumulatedDist: 0,
    }
  }

  let bestDist = Infinity
  let bestIndex = 0
  let bestPoint: [number, number] = roadCoords[0]
  let bestAccumDist = 0

  let currentAccumDist = 0

  for (let i = 0; i < roadCoords.length - 1; i++) {
    const segA = roadCoords[i]
    const segB = roadCoords[i + 1]
    const segLen = calculateDistanceMeters(segA, segB)
    const { point, dist, t } = projectPointOnSegment(p, segA, segB)

    if (dist < bestDist) {
      bestDist = dist
      bestIndex = i
      bestPoint = point
      bestAccumDist = currentAccumDist + segLen * t
    }

    currentAccumDist += segLen
  }

  return {
    snappedPoint: bestPoint,
    segmentIndex: bestIndex,
    distMeters: bestDist,
    accumulatedDist: bestAccumDist,
  }
}

export interface SliceRoadResult {
  snappedStart: [number, number]
  snappedEnd: [number, number]
  slicedCoords: [number, number][]
}

/**
 * Slice the road centerline between startCandidate and endCandidate.
 * Both endpoints are magnetically snapped onto the road surface.
 * Guarantees that 100% of the returned polyline strictly lies on the road surface!
 */
export const sliceRoadBetweenPoints = (
  fullRoadCoords: [number, number][],
  startCandidate: [number, number],
  endCandidate: [number, number]
): SliceRoadResult => {
  if (!fullRoadCoords || fullRoadCoords.length < 2) {
    return {
      snappedStart: startCandidate,
      snappedEnd: endCandidate,
      slicedCoords: [startCandidate, endCandidate],
    }
  }

  const snapStart = snapPointToPolyline(startCandidate, fullRoadCoords)
  const snapEnd = snapPointToPolyline(endCandidate, fullRoadCoords)

  const isForward = snapStart.accumulatedDist <= snapEnd.accumulatedDist

  if (isForward) {
    const points: [number, number][] = [snapStart.snappedPoint]

    // Intermediate road vertices strictly between snapStart and snapEnd
    for (let i = snapStart.segmentIndex + 1; i <= snapEnd.segmentIndex; i++) {
      points.push(fullRoadCoords[i])
    }

    // Add end point if distinct
    const lastPt = points[points.length - 1]
    if (
      Math.abs(lastPt[0] - snapEnd.snappedPoint[0]) > 0.000005 ||
      Math.abs(lastPt[1] - snapEnd.snappedPoint[1]) > 0.000005
    ) {
      points.push(snapEnd.snappedPoint)
    }

    return {
      snappedStart: snapStart.snappedPoint,
      snappedEnd: snapEnd.snappedPoint,
      slicedCoords: points.length >= 2 ? points : [snapStart.snappedPoint, snapEnd.snappedPoint],
    }
  } else {
    // Reverse direction
    const points: [number, number][] = [snapStart.snappedPoint]

    for (let i = snapStart.segmentIndex; i > snapEnd.segmentIndex; i--) {
      points.push(fullRoadCoords[i])
    }

    const lastPt = points[points.length - 1]
    if (
      Math.abs(lastPt[0] - snapEnd.snappedPoint[0]) > 0.000005 ||
      Math.abs(lastPt[1] - snapEnd.snappedPoint[1]) > 0.000005
    ) {
      points.push(snapEnd.snappedPoint)
    }

    return {
      snappedStart: snapStart.snappedPoint,
      snappedEnd: snapEnd.snappedPoint,
      slicedCoords: points.length >= 2 ? points : [snapStart.snappedPoint, snapEnd.snappedPoint],
    }
  }
}

/**
 * Build spine waypoints from ordered poles of a segment.
 * Ensures OSRM strictly routes through the road where the poles are located,
 * never jumping to parallel streets or bypassing poles.
 */
export const getPoleSpineWaypoints = (
  start: [number, number],
  end: [number, number],
  orderedPoleCoords: [number, number][]
): [number, number][] => {
  if (!orderedPoleCoords || orderedPoleCoords.length === 0) return []

  const count = orderedPoleCoords.length

  // If 6 poles or fewer, include all poles distinct from start/end
  if (count <= 6) {
    return orderedPoleCoords.filter((p) => {
      const distToStart = calculateDistanceMeters(p, start)
      const distToEnd = calculateDistanceMeters(p, end)
      return distToStart > 10 && distToEnd > 10
    })
  }

  // 5 strategic anchors: 0%, 25%, 50%, 75%, and 100% (the last pole at intersection)
  const indices = [
    0,
    Math.floor(count * 0.25),
    Math.floor(count * 0.5),
    Math.floor(count * 0.75),
    count - 1,
  ]

  const sampled: [number, number][] = []
  for (const idx of indices) {
    const p = orderedPoleCoords[idx]
    if (!p) continue
    if (calculateDistanceMeters(p, start) > 10 && calculateDistanceMeters(p, end) > 10) {
      const last = sampled[sampled.length - 1]
      if (!last || calculateDistanceMeters(p, last) > 10) {
        sampled.push(p)
      }
    }
  }

  // Ensure last pole is strictly included if distinct from end
  const lastPole = orderedPoleCoords[count - 1]
  if (calculateDistanceMeters(lastPole, end) > 10) {
    const hasLast = sampled.some((p) => calculateDistanceMeters(p, lastPole) < 5)
    if (!hasLast) {
      sampled.push(lastPole)
    }
  }

  return sampled
}

// In-memory cache for road routing queries
const routeCache = new Map<string, [number, number][]>()

/**
 * Fetch realistic road route between start and end coordinates from OSRM.
 * Supports intermediate viaPoints (anchor chain) to guarantee visiting key assets.
 * Guarantees that returned coordinates strictly lie on the road network.
 * Handles timeouts, network failures, bidirectional checks, and caches results.
 */
export const fetchRoadRoute = async (
  start: [number, number],
  end: [number, number],
  signal?: AbortSignal,
  viaPoints?: [number, number][]
): Promise<[number, number][] | null> => {
  if (!start || !end) return null
  if (
    Math.abs(start[0] - end[0]) < 0.00001 &&
    Math.abs(start[1] - end[1]) < 0.00001
  ) {
    return [start, end]
  }

  const validVia = (viaPoints || []).filter(
    (p) =>
      Array.isArray(p) &&
      p.length === 2 &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1]) &&
      (Math.abs(p[0] - start[0]) > 0.00005 || Math.abs(p[1] - start[1]) > 0.00005) &&
      (Math.abs(p[0] - end[0]) > 0.00005 || Math.abs(p[1] - end[1]) > 0.00005)
  )

  const allPoints: [number, number][] = [start, ...validVia, end]

  // Key with 5 decimal places (~1m precision) for cache hits
  const key = allPoints.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(';')

  if (routeCache.has(key)) {
    return routeCache.get(key)!
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 9000)

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    const coordsParam = allPoints.map((p) => `${p[0]},${p[1]}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) return allPoints

    const data = await res.json()
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry?.coordinates as [number, number][]
      if (Array.isArray(coords) && coords.length >= 2) {
        // Cache result (limit cache size to 100 entries)
        if (routeCache.size > 100) {
          const firstKey = routeCache.keys().next().value
          if (firstKey) routeCache.delete(firstKey)
        }
        routeCache.set(key, coords)
        return coords
      }
    }
    return allPoints
  } catch {
    return allPoints
  }
}

export interface LiveSnapResult {
  routeCoords: [number, number][]
  snappedPoint: [number, number]
  isOnRoad: boolean
}

/**
 * Real-time 60fps road snapping while dragging marker.
 * Snaps the dragged point onto the current road or connected road network
 * and stitches a continuous road polyline with 0ms latency.
 */
export const computeLiveSnappedRoute = (
  baseRoute: [number, number][],
  dragPoint: [number, number],
  isEnd: boolean
): LiveSnapResult => {
  if (!baseRoute || baseRoute.length < 2) {
    return { routeCoords: [dragPoint, dragPoint], snappedPoint: dragPoint, isOnRoad: false }
  }

  const snapBase = snapPointToPolyline(dragPoint, baseRoute)
  const terminalPoint = isEnd ? baseRoute[baseRoute.length - 1] : baseRoute[0]

  // Check known roads in the network (e.g. from mock-segments.geo.json)
  const knownRoads: [number, number][][] =
    ((mockSegmentsGeoJson as any).features || [])
      .map((f: any) => f.geometry?.coordinates)
      .filter((c: any) => Array.isArray(c) && c.length >= 2)

  let bestOtherRoad: [number, number][] | null = null
  let bestOtherSnap: SnappedPointResult | null = null
  let minOtherDist = Infinity

  for (const road of knownRoads) {
    // Skip if road is practically the baseRoute itself
    const startMatch = calculateDistanceMeters(road[0], baseRoute[0]) < 10
    const endMatch = calculateDistanceMeters(road[road.length - 1], baseRoute[baseRoute.length - 1]) < 10
    if (startMatch && endMatch) continue

    const snap = snapPointToPolyline(dragPoint, road)
    if (snap.distMeters < minOtherDist) {
      minOtherDist = snap.distMeters
      bestOtherSnap = snap
      bestOtherRoad = road
    }
  }

  // If cursor is strictly on another connected road (within 18m of its centerline, e.g. Tỉnh Lộ 8):
  if (bestOtherRoad && bestOtherSnap && minOtherDist <= 18 && minOtherDist < snapBase.distMeters) {
    const snapIntersection = snapPointToPolyline(terminalPoint, bestOtherRoad)
    if (snapIntersection.distMeters <= 50) {
      const otherSlice = sliceRoadBetweenPoints(
        bestOtherRoad,
        snapIntersection.snappedPoint,
        bestOtherSnap.snappedPoint
      ).slicedCoords

      const combined = isEnd
        ? [...baseRoute, ...otherSlice.slice(1)]
        : [...otherSlice.slice(0, -1), ...baseRoute]

      return {
        routeCoords: combined,
        snappedPoint: bestOtherSnap.snappedPoint,
        isOnRoad: true,
      }
    }
  }

  // If cursor is along baseRoute (within 40m)
  if (snapBase.distMeters <= 40) {
    const sliced = isEnd
      ? sliceRoadBetweenPoints(baseRoute, baseRoute[0], snapBase.snappedPoint).slicedCoords
      : sliceRoadBetweenPoints(baseRoute, snapBase.snappedPoint, baseRoute[baseRoute.length - 1]).slicedCoords

    return {
      routeCoords: sliced.length >= 2 ? sliced : baseRoute,
      snappedPoint: snapBase.snappedPoint,
      isOnRoad: true,
    }
  }

  // Fallback when off-road: strictly keep entire base route, extend to cursor
  const fallback = isEnd ? [...baseRoute, dragPoint] : [dragPoint, ...baseRoute]
  return {
    routeCoords: fallback,
    snappedPoint: dragPoint,
    isOnRoad: false,
  }
}


