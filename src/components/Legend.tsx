import { useState } from 'react'
import { ZoneInfo } from '../types'

interface LegendProps {
  zones: Record<string, ZoneInfo>
  expanded: boolean
  hiddenZones: number[]
  onToggleZoneVisible: (zoneId: number) => void
}

export default function Legend({ zones, expanded, hiddenZones, onToggleZoneVisible }: LegendProps) {
  const [collapsed, setCollapsed] = useState(true)

  const isDesktop = window.innerWidth > 768

  return (
    <div
      className={`legend ${collapsed ? 'collapsed' : ''}`}
      style={{ bottom: !isDesktop && expanded ? 'calc(50vh + 12px)' : undefined }}
    >
      <button
        type="button"
        className="legend-title"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((v) => !v)}
      >
        권역별 안내
        <span className={`legend-chevron ${collapsed ? 'down' : 'up'}`}>▾</span>
      </button>
      {!collapsed &&
        Object.entries(zones).map(([id, zone]) => {
          const zoneId = Number(id)
          const off = hiddenZones.includes(zoneId)
          return (
            <button
              type="button"
              className={`legend-item ${off ? 'off' : ''}`}
              key={id}
              aria-pressed={!off}
              onClick={() => onToggleZoneVisible(zoneId)}
            >
              <span className="dot" style={{ background: zone.color }} />
              {zone.name}
            </button>
          )
        })}
    </div>
  )
}
