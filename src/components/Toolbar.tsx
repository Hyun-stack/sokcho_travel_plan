interface ToolbarProps {
  title: string
  filterOpen: boolean
  onFilterOpenChange: (value: boolean) => void
  routeMode: boolean
  onRouteModeChange: (value: boolean) => void
  favOnly: boolean
  onFavOnlyChange: (value: boolean) => void
  routeCount: number
  onClearRoute: () => void
  activeFilterCount: number
}

export default function Toolbar({
  title,
  filterOpen,
  onFilterOpenChange,
  routeMode,
  onRouteModeChange,
  favOnly,
  onFavOnlyChange,
  routeCount,
  onClearRoute,
  activeFilterCount,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <span className="toolbar-title">{title}</span>
      <div className="toolbar-actions">
        <button
          type="button"
          className={`tb-btn ${filterOpen ? 'on' : ''}`}
          title="필터"
          aria-pressed={filterOpen}
          onClick={() => onFilterOpenChange(!filterOpen)}
        >
          🔍
          {activeFilterCount > 0 && <span className="tb-badge">{activeFilterCount}</span>}
        </button>
        <button
          type="button"
          className={`tb-btn ${routeMode ? 'on' : ''}`}
          title="경로 모드"
          aria-pressed={routeMode}
          onClick={() => onRouteModeChange(!routeMode)}
        >
          🧭
          {routeCount > 0 && <span className="tb-badge">{routeCount}</span>}
        </button>
        <button
          type="button"
          className={`tb-btn ${favOnly ? 'on' : ''}`}
          title="즐겨찾기만 보기"
          aria-pressed={favOnly}
          onClick={() => onFavOnlyChange(!favOnly)}
        >
          ⭐
        </button>
        {routeCount > 0 && (
          <button type="button" className="tb-btn" title="경로 초기화" onClick={onClearRoute}>
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}
