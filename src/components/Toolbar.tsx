import { Place, ZoneInfo } from '../types'
import {
  categoryEmoji,
  nextViewMode,
  ViewMode,
  VIEW_MODE_ICON,
  VIEW_MODE_LABEL,
} from '../filters'
import ZoneMultiSelect from './ZoneMultiSelect'
import SearchBox from './SearchBox'

interface ToolbarProps {
  places: Place[]
  onSelectPlace: (id: string) => void
  routeMode: boolean
  onRouteModeChange: (value: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  routeCount: number
  onClearRoute: () => void
  zones: Record<string, ZoneInfo>
  selectedZones: number[]
  onSelectedZonesChange: (zones: number[]) => void
  categories: string[]
  selectedCategories: string[]
  onSelectedCategoriesChange: (categories: string[]) => void
  mapOnly: boolean
  onMapOnlyChange: (value: boolean) => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export default function Toolbar({
  places,
  onSelectPlace,
  routeMode,
  onRouteModeChange,
  viewMode,
  onViewModeChange,
  routeCount,
  onClearRoute,
  zones,
  selectedZones,
  onSelectedZonesChange,
  categories,
  selectedCategories,
  onSelectedCategoriesChange,
  mapOnly,
  onMapOnlyChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <SearchBox places={places} onSelectPlace={onSelectPlace} />
        <div className="toolbar-actions">
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
            className={`tb-btn ${viewMode !== 'all' ? 'on' : ''}`}
            title={VIEW_MODE_LABEL[viewMode]}
            aria-label={VIEW_MODE_LABEL[viewMode]}
            onClick={() => onViewModeChange(nextViewMode(viewMode))}
          >
            {VIEW_MODE_ICON[viewMode]}
          </button>
          {routeCount > 0 && (
            <button type="button" className="tb-btn" title="경로 초기화" onClick={onClearRoute}>
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="toolbar-row toolbar-filters">
        <ZoneMultiSelect
          zones={zones}
          selectedZones={selectedZones}
          onSelectedZonesChange={onSelectedZonesChange}
        />
        <button
          type="button"
          className={`chip map-only-toggle ${mapOnly ? 'on' : ''}`}
          aria-pressed={mapOnly}
          onClick={() => onMapOnlyChange(!mapOnly)}
        >
          🗺️ 현재 지도 장소만 보기
        </button>
        <div className="toolbar-cat-row">
          {categories.map((category) => {
            const on = selectedCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                className={`chip ${on ? 'on' : ''}`}
                onClick={() => onSelectedCategoriesChange(toggle(selectedCategories, category))}
              >
                {categoryEmoji(category)} {category}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
