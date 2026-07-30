import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Place, ZoneInfo } from '../types'
import { categoryEmoji } from '../filters'
import { openNaverMapDirections } from '../naverMap'

interface PanelProps {
  visiblePlaces: Place[]
  zones: Record<string, ZoneInfo>
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
  isVisited: (id: string) => boolean
  onToggleVisited: (id: string) => void
  routeMode: boolean
  routeIndex: (id: string) => number
  onToggleRoute: (id: string) => void
  onSelectPlace: (id: string) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  mapOnly: boolean
  onMapOnlyChange: (value: boolean) => void
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  {
    visiblePlaces,
    zones,
    isFav,
    onToggleFav,
    isVisited,
    onToggleVisited,
    routeMode,
    routeIndex,
    onToggleRoute,
    onSelectPlace,
    expanded,
    onExpandedChange,
    mapOnly,
    onMapOnlyChange,
  },
  forwardedRef,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => panelRef.current!)
  const dragState = useRef({ startY: 0, initialTranslateY: 0, dragging: false })
  const [dragTransform, setDragTransform] = useState<number | null>(null)
  const [noTransition, setNoTransition] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    function resetStuckDrag() {
      if (!dragState.current.dragging) return
      dragState.current.dragging = false
      setNoTransition(false)
      setDragTransform(null)
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') resetStuckDrag()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', resetStuckDrag)
    window.addEventListener('focus', resetStuckDrag)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', resetStuckDrag)
      window.removeEventListener('focus', resetStuckDrag)
    }
  }, [])

  const isDesktop = () => window.innerWidth > 768

  function handleTouchStart(e: React.TouchEvent) {
    if (isDesktop()) return
    const panel = panelRef.current
    if (!panel) return
    dragState.current.startY = e.touches[0].clientY
    const transformVal = window.getComputedStyle(panel).transform
    dragState.current.initialTranslateY =
      transformVal !== 'none' ? new DOMMatrix(transformVal).m42 : 0
    dragState.current.dragging = true
    setNoTransition(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragState.current.dragging || isDesktop()) return
    const panel = panelRef.current
    if (!panel) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - dragState.current.startY
    let newY = dragState.current.initialTranslateY + deltaY
    const maxTranslate = panel.offsetHeight - 48
    if (newY < 0) newY = 0
    if (newY > maxTranslate) newY = maxTranslate
    setDragTransform(newY)
  }

  function handleTouchEnd() {
    if (!dragState.current.dragging || isDesktop()) return
    dragState.current.dragging = false
    setNoTransition(false)
    const panel = panelRef.current
    if (!panel) return
    const maxTranslate = panel.offsetHeight - 48
    const current = dragTransform ?? (expanded ? 0 : maxTranslate)
    setDragTransform(null)
    onExpandedChange(current < maxTranslate / 2)
  }

  function handleHandleClick() {
    if (isDesktop()) return
    onExpandedChange(!expanded)
  }

  function handleItemClick(id: string) {
    if (routeMode) {
      onToggleRoute(id)
      return
    }
    setOpenId((prev) => (prev === id ? null : id))
  }

  const style: React.CSSProperties = {}
  if (!isDesktop()) {
    if (dragTransform !== null) {
      style.transform = `translateY(${dragTransform}px)`
    } else {
      style.transform = expanded ? 'translateY(0)' : 'translateY(calc(100% - 48px))'
    }
  }

  return (
    <div id="panel" ref={panelRef} className={noTransition ? 'no-transition' : ''} style={style}>
      <div
        id="panel-drag-handle"
        onClick={handleHandleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="drag-bar" />
        <div id="panel-head">
          <span className="title">장소 목록</span>
          <span className="count">{visiblePlaces.length}</span>
        </div>
        <label className="map-only-check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={mapOnly}
            onChange={() => onMapOnlyChange(!mapOnly)}
          />
          🗺️ 현재 지도 장소만 보기
        </label>
      </div>
      {routeMode && <div className="route-hint">경로 모드: 장소를 탭한 순서대로 경로에 추가됩니다.</div>}
      <div id="panel-list">
        {visiblePlaces.length === 0 ? (
          <div className="p-empty">표시할 장소가 없습니다.</div>
        ) : (
          visiblePlaces.map((place) => {
            const zone = zones[String(place.zone)]
            const idx = routeIndex(place.id)
            const open = openId === place.id
            return (
              <div className={`p-item ${open ? 'open' : ''}`} key={place.id}>
                <div className="p-row" onClick={() => handleItemClick(place.id)}>
                  {idx > 0 && <span className="p-seq">{idx}</span>}
                  <span className={`nm ${isVisited(place.id) ? 'done' : ''}`}>{place.name}</span>
                  <button
                    className={`star ${isFav(place.id) ? 'on' : 'off'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFav(place.id)
                    }}
                  >
                    {isFav(place.id) ? '★' : '☆'}
                  </button>
                </div>
                {open && (
                  <div className="p-detail" onClick={(e) => e.stopPropagation()}>
                    <div className="tags">
                      <span
                        className="badge"
                        style={{ background: `${zone?.color}20`, color: zone?.color }}
                      >
                        {zone?.name}
                      </span>
                      <span className="badge cat">
                        {categoryEmoji(place.category)} {place.category}
                      </span>
                    </div>
                    <div className="coords">
                      {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                    </div>
                    <label className="visited-check">
                      <input
                        type="checkbox"
                        checked={isVisited(place.id)}
                        onChange={() => onToggleVisited(place.id)}
                      />
                      방문 완료
                    </label>
                    <div className="p-detail-actions">
                      <button
                        type="button"
                        className="detail-btn"
                        onClick={() => onSelectPlace(place.id)}
                      >
                        지도에서 보기
                      </button>
                      <button
                        type="button"
                        className={`detail-btn ${idx > 0 ? 'on' : ''}`}
                        onClick={() => onToggleRoute(place.id)}
                      >
                        {idx > 0 ? `경로 ${idx} 제거` : '경로 추가'}
                      </button>
                      <button
                        type="button"
                        className="detail-btn naver-btn"
                        onClick={() => openNaverMapDirections(place.name, place.lat, place.lng)}
                      >
                        🧭 네이버 지도
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})

export default Panel
