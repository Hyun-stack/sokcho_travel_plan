import { ZoneInfo } from '../types'
import { categoryEmoji } from '../filters'

interface FilterChipsProps {
  zones: Record<string, ZoneInfo>
  categories: string[]
  selectedZones: number[]
  onSelectedZonesChange: (zones: number[]) => void
  selectedCategories: string[]
  onSelectedCategoriesChange: (categories: string[]) => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

export default function FilterChips({
  zones,
  categories,
  selectedZones,
  onSelectedZonesChange,
  selectedCategories,
  onSelectedCategoriesChange,
}: FilterChipsProps) {
  const hasFilters = selectedZones.length > 0 || selectedCategories.length > 0

  return (
    <div className="filter-chips-bar">
      <div className="chip-scroll-row">
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
      <div className="chip-scroll-row">
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
        {hasFilters && (
          <button
            type="button"
            className="chip-clear"
            onClick={() => {
              onSelectedZonesChange([])
              onSelectedCategoriesChange([])
            }}
          >
            초기화
          </button>
        )}
      </div>
    </div>
  )
}
