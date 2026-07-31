import { useMemo, useRef, useState } from 'react'
import MapView, { MapViewHandle } from './components/MapView'
import Legend from './components/Legend'
import Panel from './components/Panel'
import Toolbar from './components/Toolbar'
import { useFavorites } from './hooks/useFavorites'
import { useVisited } from './hooks/useVisited'
import { useRoute } from './hooks/useRoute'
import rawData from './data/sokcho.json'
import { DestinationData, Place } from './types'
import { matchesFilters, PlaceFilters, ViewMode } from './filters'
import { assignZoneColors } from './zoneColors'

const rawDestination = rawData as unknown as Omit<DestinationData, 'zones'> & {
  zones: Record<string, { name: string }>
}
const destination: DestinationData = {
  ...rawDestination,
  zones: assignZoneColors(rawDestination.zones),
}

const categories = Array.from(new Set(destination.places.map((p) => p.category))).sort((a, b) =>
  a.localeCompare(b, 'ko'),
)

export default function App() {
  const [env, setEnv] = useState<string>(() => localStorage.getItem('env:selected') || '')

  const { isFav, toggleFav } = useFavorites(destination.id, env)
  const { isVisited, toggleVisited } = useVisited(destination.id, env)
  const { routeOrder, routeIndex, isInRoute, toggleRoute, clearRoute } = useRoute(destination.id, env)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [hiddenZones, setHiddenZones] = useState<number[]>([])
  const [routeMode, setRouteMode] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mapOnly, setMapOnly] = useState(true)
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([])
  const mapRef = useRef<MapViewHandle>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const filters = useMemo<PlaceFilters>(
    () => ({ viewMode, selectedCategories, hiddenZones }),
    [viewMode, selectedCategories, hiddenZones],
  )

  const filteredPlaces = useMemo(
    () => destination.places.filter((p) => matchesFilters(p, filters, isFav, isInRoute)),
    [filters, isFav, isInRoute],
  )

  const panelPlaces = mapOnly ? visiblePlaces : filteredPlaces

  function handleToggleZoneVisible(zoneId: number) {
    setHiddenZones((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId],
    )
  }

  function handleSelectPlace(id: string) {
    mapRef.current?.focusPlace(id)
    setExpanded(false)
  }

  return (
    <>
      <MapView
        ref={mapRef}
        data={destination}
        isFav={isFav}
        onToggleFav={toggleFav}
        isVisited={isVisited}
        onToggleVisited={toggleVisited}
        filters={filters}
        routeMode={routeMode}
        routeOrder={routeOrder}
        routeIndex={routeIndex}
        isInRoute={isInRoute}
        onToggleRoute={toggleRoute}
        panelExpanded={expanded}
        onVisibleChange={setVisiblePlaces}
        panelRef={panelRef}
      />
      <Toolbar
        places={destination.places}
        onSelectPlace={handleSelectPlace}
        routeMode={routeMode}
        onRouteModeChange={setRouteMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        routeCount={routeOrder.length}
        onClearRoute={clearRoute}
        categories={categories}
        selectedCategories={selectedCategories}
        onSelectedCategoriesChange={setSelectedCategories}
        destinationId={destination.id}
        env={env}
        onEnvChange={(v: string) => {
          localStorage.setItem('env:selected', v)
          setEnv(v)
        }}
      />
      <Legend
        zones={destination.zones}
        expanded={expanded}
        hiddenZones={hiddenZones}
        onToggleZoneVisible={handleToggleZoneVisible}
      />
      <Panel
        ref={panelRef}
        visiblePlaces={panelPlaces}
        zones={destination.zones}
        isFav={isFav}
        onToggleFav={toggleFav}
        isVisited={isVisited}
        onToggleVisited={toggleVisited}
        routeMode={routeMode}
        routeIndex={routeIndex}
        onToggleRoute={toggleRoute}
        onSelectPlace={handleSelectPlace}
        expanded={expanded}
        onExpandedChange={setExpanded}
        mapOnly={mapOnly}
        onMapOnlyChange={setMapOnly}
      />
    </>
  )
}
