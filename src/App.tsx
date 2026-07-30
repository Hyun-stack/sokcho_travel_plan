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
import { PlaceFilters } from './filters'

const destination = rawData as unknown as DestinationData

const categories = Array.from(new Set(destination.places.map((p) => p.category))).sort((a, b) =>
  a.localeCompare(b, 'ko'),
)

export default function App() {
  const { isFav, toggleFav } = useFavorites(destination.id)
  const { isVisited, toggleVisited } = useVisited(destination.id)
  const { routeOrder, routeIndex, toggleRoute, clearRoute } = useRoute(destination.id)
  const [favOnly, setFavOnly] = useState(false)
  const [selectedZones, setSelectedZones] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [routeMode, setRouteMode] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([])
  const mapRef = useRef<MapViewHandle>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const filters = useMemo<PlaceFilters>(
    () => ({ favOnly, selectedZones, selectedCategories }),
    [favOnly, selectedZones, selectedCategories],
  )

  function handleSelectPlace(id: string) {
    mapRef.current?.focusPlace(id)
    setExpanded(false)
  }

  function handleFilterOpenChange(value: boolean) {
    setFilterOpen(value)
    if (value) setExpanded(true)
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
        onToggleRoute={toggleRoute}
        panelExpanded={expanded}
        onVisibleChange={setVisiblePlaces}
        panelRef={panelRef}
      />
      <Toolbar
        title={destination.title}
        filterOpen={filterOpen}
        onFilterOpenChange={handleFilterOpenChange}
        routeMode={routeMode}
        onRouteModeChange={setRouteMode}
        favOnly={favOnly}
        onFavOnlyChange={setFavOnly}
        routeCount={routeOrder.length}
        onClearRoute={clearRoute}
        activeFilterCount={selectedZones.length + selectedCategories.length}
      />
      <Legend zones={destination.zones} expanded={expanded} />
      <Panel
        ref={panelRef}
        visiblePlaces={visiblePlaces}
        zones={destination.zones}
        categories={categories}
        favOnly={favOnly}
        onFavOnlyChange={setFavOnly}
        selectedZones={selectedZones}
        onSelectedZonesChange={setSelectedZones}
        selectedCategories={selectedCategories}
        onSelectedCategoriesChange={setSelectedCategories}
        filterOpen={filterOpen}
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
      />
    </>
  )
}
