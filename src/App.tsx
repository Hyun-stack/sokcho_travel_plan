import { useRef, useState } from 'react'
import MapView, { MapViewHandle } from './components/MapView'
import Legend from './components/Legend'
import Panel from './components/Panel'
import { useFavorites } from './hooks/useFavorites'
import rawData from './data/sokcho.json'
import { DestinationData, Place } from './types'

const destination = rawData as unknown as DestinationData

export default function App() {
  const { isFav, toggleFav } = useFavorites(destination.id)
  const [favOnly, setFavOnly] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([])
  const mapRef = useRef<MapViewHandle>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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
        favOnly={favOnly}
        panelExpanded={expanded}
        onVisibleChange={setVisiblePlaces}
        panelRef={panelRef}
      />
      <div className="title-box">
        <h1>{destination.title}</h1>
        <p>{destination.subtitle}</p>
      </div>
      <Legend zones={destination.zones} expanded={expanded} />
      <Panel
        ref={panelRef}
        visiblePlaces={visiblePlaces}
        favOnly={favOnly}
        onFavOnlyChange={setFavOnly}
        isFav={isFav}
        onToggleFav={toggleFav}
        onSelectPlace={handleSelectPlace}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
    </>
  )
}
