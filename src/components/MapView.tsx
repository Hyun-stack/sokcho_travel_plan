import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { DestinationData, Place } from '../types'
import { PlaceFilters, matchesFilters } from '../filters'

export interface MapViewHandle {
  focusPlace: (id: string) => void
}

interface MapViewProps {
  data: DestinationData
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
  isVisited: (id: string) => boolean
  onToggleVisited: (id: string) => void
  filters: PlaceFilters
  routeMode: boolean
  routeOrder: string[]
  routeIndex: (id: string) => number
  isInRoute: (id: string) => boolean
  onToggleRoute: (id: string) => void
  panelExpanded: boolean
  onVisibleChange: (places: Place[]) => void
  panelRef: React.RefObject<HTMLDivElement>
}

interface IconState {
  color: string
  fav: boolean
  dimmed: boolean
  visited: boolean
  routeIndex: number
}

function makeIcon({ color, fav, dimmed, visited, routeIndex }: IconState) {
  const size = fav ? 24 : 18
  const inner = fav
    ? `<div class="mk-fav">⭐</div>`
    : `<div class="mk-dot" style="background:${color}"></div>`
  const badge = routeIndex > 0 ? `<div class="mk-seq">${routeIndex}</div>` : ''
  const check = visited ? `<div class="mk-check">✓</div>` : ''
  const classes = ['mk-wrap', dimmed ? 'mk-dim' : '', visited ? 'mk-visited' : '']
    .filter(Boolean)
    .join(' ')
  return L.divIcon({
    className: '',
    html: `<div class="${classes}" style="width:${size}px;height:${size}px">${inner}${badge}${check}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function getVisibleBounds(map: L.Map, panel: HTMLDivElement | null): L.LatLngBounds {
  const bounds = map.getBounds()
  if (window.innerWidth > 768) return bounds
  if (!panel) return bounds

  const panelRect = panel.getBoundingClientRect()
  const mapHeight = map.getContainer().clientHeight
  const coveredHeight = Math.max(0, mapHeight - panelRect.top)
  if (coveredHeight <= 0) return bounds

  const southWestPoint = L.point(0, mapHeight - coveredHeight)
  const southWestLatLng = map.containerPointToLatLng(southWestPoint)
  return L.latLngBounds(southWestLatLng, bounds.getNorthEast())
}

function VisibilityTracker({
  data,
  filters,
  isFav,
  isInRoute,
  panelExpanded,
  onVisibleChange,
  panelRef,
}: {
  data: DestinationData
  filters: PlaceFilters
  isFav: (id: string) => boolean
  isInRoute: (id: string) => boolean
  panelExpanded: boolean
  onVisibleChange: (places: Place[]) => void
  panelRef: React.RefObject<HTMLDivElement>
}) {
  const map = useMap()

  useEffect(() => {
    const bounds = L.latLngBounds(data.places.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [30, 30] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(recompute, panelExpanded ? 305 : 0)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isFav, isInRoute, panelExpanded])

  function recompute() {
    map.invalidateSize()
    const bounds = getVisibleBounds(map, panelRef.current)
    const visible = data.places.filter(
      (p) => bounds.contains([p.lat, p.lng]) && matchesFilters(p, filters, isFav, isInRoute),
    )
    onVisibleChange(visible)
  }

  useMapEvents({
    moveend: recompute,
    zoomend: recompute,
  })

  return null
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    data,
    isFav,
    onToggleFav,
    isVisited,
    onToggleVisited,
    filters,
    routeMode,
    routeOrder,
    routeIndex,
    isInRoute,
    onToggleRoute,
    panelExpanded,
    onVisibleChange,
    panelRef,
  },
  ref,
) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})
  const iconCache = useRef(new Map<string, L.DivIcon>())
  const clusterRef = useRef<{ refreshClusters: () => void } | null>(null)

  useEffect(() => {
    clusterRef.current?.refreshClusters()
  }, [filters, isFav, isInRoute])

  function getIcon(state: IconState) {
    const key = `${state.color}|${state.fav}|${state.dimmed}|${state.visited}|${state.routeIndex}`
    const cached = iconCache.current.get(key)
    if (cached) return cached
    const icon = makeIcon(state)
    iconCache.current.set(key, icon)
    return icon
  }

  const placeById = useMemo(() => {
    const map = new Map<string, Place>()
    data.places.forEach((p) => map.set(p.id, p))
    return map
  }, [data.places])

  const routeLine = useMemo<[number, number][]>(
    () =>
      routeOrder
        .map((id) => placeById.get(id))
        .filter((p): p is Place => Boolean(p))
        .map((p) => [p.lat, p.lng] as [number, number]),
    [routeOrder, placeById],
  )

  useImperativeHandle(ref, () => ({
    focusPlace(id: string) {
      const map = mapRef.current
      const marker = markerRefs.current[id]
      if (!map || !marker) return
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15))
      marker.openPopup()
    },
  }))

  return (
    <MapContainer
      id="map"
      center={data.center}
      zoom={data.defaultZoom}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={19}
      />
      {routeLine.length >= 2 && (
        <Polyline
          positions={routeLine}
          pathOptions={{ color: '#334155', weight: 3, dashArray: '8 6', opacity: 0.9 }}
        />
      )}
      <MarkerClusterGroup
        ref={clusterRef as React.Ref<never>}
        maxClusterRadius={50}
        iconCreateFunction={(cluster: any) => {
          const children: L.Marker[] = cluster.getAllChildMarkers()
          const zoneCounts: Record<string, number> = {}
          let dimmedCount = 0
          children.forEach((m) => {
            const zone = String((m as unknown as { zone?: number }).zone)
            zoneCounts[zone] = (zoneCounts[zone] || 0) + 1
            if ((m as unknown as { dimmed?: boolean }).dimmed) dimmedCount++
          })
          const majorityZone = Object.keys(zoneCounts).sort(
            (a, b) => zoneCounts[b] - zoneCounts[a],
          )[0]
          const color = data.zones[majorityZone]?.color || '#555'
          const count = cluster.getChildCount()
          const dimClass = dimmedCount === count ? 'zone-cluster-dim' : ''
          return L.divIcon({
            html: `<div class="zone-cluster ${dimClass}" style="background:${color}; width:36px; height:36px; font-size:14px;">${count}</div>`,
            className: '',
            iconSize: [36, 36],
          })
        }}
      >
        {data.places.map((place) => {
          const zoneKey = String(place.zone)
          const zone = data.zones[zoneKey]
          const fav = isFav(place.id)
          const visited = isVisited(place.id)
          const idx = routeIndex(place.id)
          const dimmed = !matchesFilters(place, filters, isFav, isInRoute)
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={getIcon({
                color: zone?.color || '#555',
                fav,
                dimmed,
                visited,
                routeIndex: idx,
              })}
              zIndexOffset={idx > 0 ? 2000 : fav ? 1000 : 0}
              eventHandlers={
                routeMode ? { click: () => onToggleRoute(place.id) } : undefined
              }
              ref={(m) => {
                if (m) {
                  ;(m as unknown as { zone: number; dimmed: boolean }).zone = place.zone
                  ;(m as unknown as { zone: number; dimmed: boolean }).dimmed = dimmed
                }
                markerRefs.current[place.id] = m
              }}
            >
              {!routeMode && (
                <Popup>
                  <div className="place-popup">
                    <b>{place.name}</b>
                    <div className="tags">
                      <span
                        className="badge"
                        style={{ background: `${zone?.color}20`, color: zone?.color }}
                      >
                        {zone?.name}
                      </span>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {place.category}
                      </span>
                    </div>
                    <button className="fav-btn" onClick={() => onToggleFav(place.id)}>
                      {fav ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
                    </button>
                    <button className="fav-btn" onClick={() => onToggleVisited(place.id)}>
                      {visited ? '✓ 방문 완료 해제' : '□ 방문 완료'}
                    </button>
                    <button className="fav-btn" onClick={() => onToggleRoute(place.id)}>
                      {idx > 0 ? `경로 ${idx} 제거` : '＋ 경로 추가'}
                    </button>
                  </div>
                </Popup>
              )}
            </Marker>
          )
        })}
      </MarkerClusterGroup>
      <VisibilityTracker
        data={data}
        filters={filters}
        isFav={isFav}
        isInRoute={isInRoute}
        panelExpanded={panelExpanded}
        onVisibleChange={onVisibleChange}
        panelRef={panelRef}
      />
    </MapContainer>
  )
})

export default MapView
