import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Place } from '../types'

interface PanelProps {
  visiblePlaces: Place[]
  favOnly: boolean
  onFavOnlyChange: (value: boolean) => void
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
  onSelectPlace: (id: string) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  {
    visiblePlaces,
    favOnly,
    onFavOnlyChange,
    isFav,
    onToggleFav,
    onSelectPlace,
    expanded,
    onExpandedChange,
  },
  forwardedRef,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => panelRef.current!)
  const dragState = useRef({ startY: 0, initialTranslateY: 0, dragging: false })
  const [dragTransform, setDragTransform] = useState<number | null>(null)
  const [noTransition, setNoTransition] = useState(false)

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
          <span className="title">화면 내 장소 목록</span>
          <span className="count">{visiblePlaces.length}</span>
        </div>
      </div>
      <div className="filter-bar">
        <label>
          <input
            type="checkbox"
            checked={favOnly}
            onChange={(e) => onFavOnlyChange(e.target.checked)}
          />
          ⭐ 즐겨찾기한 장소만 보기
        </label>
      </div>
      <div id="panel-list">
        {visiblePlaces.length === 0 ? (
          <div className="p-empty">표시할 장소가 없습니다.</div>
        ) : (
          visiblePlaces.map((place) => (
            <div className="p-item" key={place.id} onClick={() => onSelectPlace(place.id)}>
              <span className="nm">{place.name}</span>
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
          ))
        )}
      </div>
    </div>
  )
})

export default Panel
