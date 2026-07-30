import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { DestinationData, Place } from '../types'

export interface MapViewHandle {
  focusPlace: (id: string) => void
}

interface MapViewProps {
  data: DestinationData
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
  favOnly: boolean
  panelExpanded: boolean
  onVisibleChange: (places: Place[]) => void
  panelRef: React.RefObject<HTMLDivElement>
}

function makeIcon(color: string, fav: boolean) {
  return L.divIcon({
    className: '',
    html: fav
      ? `<div style="width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #f59e0b;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">⭐</div>`
      : `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: fav ? [24, 24] : [18, 18],
    iconAnchor: fav ? [12, 12] : [9, 9],
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
  favOnly,
  isFav,
  panelExpanded,
  onVisibleChange,
  panelRef,
}: {
  data: DestinationData
  favOnly: boolean
  isFav: (id: string) => boolean
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
  }, [favOnly, panelExpanded])

  function recompute() {
    map.invalidateSize()
    const bounds = getVisibleBounds(map, panelRef.current)
    let visible = data.places.filter((p) => bounds.contains([p.lat, p.lng]))
    if (favOnly) visible = visible.filter((p) => isFav(p.id))
    onVisibleChange(visible)
  }

  useMapEvents({
    moveend: recompute,
    zoomend: recompute,
  })

  return null
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { data, isFav, onToggleFav, favOnly, panelExpanded, onVisibleChange, panelRef },
  ref,
) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})

  const zoneIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>()
    Object.entries(data.zones).forEach(([id, zone]) => {
      icons.set(id, makeIcon(zone.color, false))
    })
    return icons
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.zones])
  const favIcon = useMemo(() => makeIcon('', true), [])

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
      <MarkerClusterGroup
        maxClusterRadius={50}
        iconCreateFunction={(cluster: any) => {
          const children: L.Marker[] = cluster.getAllChildMarkers()
          const zoneCounts: Record<string, number> = {}
          children.forEach((m) => {
            const zone = String((m as unknown as { zone?: number }).zone)
            zoneCounts[zone] = (zoneCounts[zone] || 0) + 1
          })
          const majorityZone = Object.keys(zoneCounts).sort(
            (a, b) => zoneCounts[b] - zoneCounts[a],
          )[0]
          const color = data.zones[majorityZone]?.color || '#555'
          const count = cluster.getChildCount()
          return L.divIcon({
            html: `<div class="zone-cluster" style="background:${color}; width:36px; height:36px; font-size:14px;">${count}</div>`,
            className: '',
            iconSize: [36, 36],
          })
        }}
      >
        {data.places.map((place) => {
          const zoneKey = String(place.zone)
          const zone = data.zones[zoneKey]
          const fav = isFav(place.id)
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={fav ? favIcon : zoneIcons.get(zoneKey) ?? makeIcon('#555', false)}
              zIndexOffset={fav ? 1000 : 0}
              ref={(m) => {
                if (m) (m as unknown as { zone: number }).zone = place.zone
                markerRefs.current[place.id] = m
              }}
            >
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
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
      <VisibilityTracker
        data={data}
        favOnly={favOnly}
        isFav={isFav}
        panelExpanded={panelExpanded}
        onVisibleChange={onVisibleChange}
        panelRef={panelRef}
      />
    </MapContainer>
  )
})

export default MapView
