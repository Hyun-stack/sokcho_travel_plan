import { ZoneInfo } from '../types'
import { categoryEmoji } from '../filters'

interface FilterBarProps {
  zones: Record<string, ZoneInfo>
  categories: string[]
  selectedZones: number[]
  onSelectedZonesChange: (zones: number[]) => void
  selectedCategories: string[]
  onSelectedCategoriesChange: (categories: string[]) => void
  favOnly: boolean
  onFavOnlyChange: (value: boolean) => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export default function FilterBar({
  zones,
  categories,
  selectedZones,
  onSelectedZonesChange,
  selectedCategories,
  onSelectedCategoriesChange,
  favOnly,
  onFavOnlyChange,
}: FilterBarProps) {
  const hasFilters = selectedZones.length > 0 || selectedCategories.length > 0

  return (
    <div className="filter-bar">
      <div className="chip-group">
        <span className="chip-label">권역</span>
        <div className="chip-row">
          {Object.entries(zones).map(([id, zone]) => {
            const zoneId = Number(id)
            const on = selectedZones.includes(zoneId)
            return (
              <button
                key={id}
                type="button"
                className={`chip ${on ? 'on' : ''}`}
                onClick={() => onSelectedZonesChange(toggle(selectedZones, zoneId))}
              >
                <span className="dot" style={{ background: zone.color }} />
                {zone.name}
              </button>
            )
          })}
        </div>
      </div>
      <div className="chip-group">
        <span className="chip-label">카테고리</span>
        <div className="chip-row">
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
      <div className="filter-foot">
        <label>
          <input
            type="checkbox"
            checked={favOnly}
            onChange={(e) => onFavOnlyChange(e.target.checked)}
          />
          ⭐ 즐겨찾기한 장소만 보기
        </label>
        {hasFilters && (
          <button
            type="button"
            className="chip-clear"
            onClick={() => {
              onSelectedZonesChange([])
              onSelectedCategoriesChange([])
            }}
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  )
}
