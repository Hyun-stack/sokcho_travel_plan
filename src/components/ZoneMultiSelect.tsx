import { useEffect, useRef, useState } from 'react'
import { ZoneInfo } from '../types'

interface ZoneMultiSelectProps {
  zones: Record<string, ZoneInfo>
  selectedZones: number[]
  onSelectedZonesChange: (zones: number[]) => void
}

export default function ZoneMultiSelect({
  zones,
  selectedZones,
  onSelectedZonesChange,
}: ZoneMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleToggleZone(zoneId: number) {
    onSelectedZonesChange(
      selectedZones.includes(zoneId)
        ? selectedZones.filter((z) => z !== zoneId)
        : [...selectedZones, zoneId],
    )
  }

  return (
    <div className="zone-select" ref={rootRef}>
      <button
        type="button"
        className={`tb-btn zone-select-btn ${selectedZones.length > 0 ? 'on' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        권역
        {selectedZones.length > 0 && <span className="tb-badge">{selectedZones.length}</span>}
        <span className={`legend-chevron ${open ? 'up' : 'down'}`}>▾</span>
      </button>
      {open && (
        <div className="zone-select-menu">
          {Object.entries(zones).map(([id, zone]) => {
            const zoneId = Number(id)
            const checked = selectedZones.includes(zoneId)
            return (
              <label className="zone-select-option" key={id}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleZone(zoneId)}
                />
                <span className="dot" style={{ background: zone.color }} />
                {zone.name}
              </label>
            )
          })}
          {selectedZones.length > 0 && (
            <button
              type="button"
              className="zone-select-clear"
              onClick={() => onSelectedZonesChange([])}
            >
              선택 해제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
