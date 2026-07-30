import { useState } from 'react'
import { ZoneInfo } from '../types'

interface LegendProps {
  zones: Record<string, ZoneInfo>
  expanded: boolean
}

export default function Legend({ zones, expanded }: LegendProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`legend ${collapsed ? 'collapsed' : ''}`}
      style={{ bottom: expanded ? 'calc(50vh + 12px)' : '60px' }}
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
        Object.entries(zones).map(([id, zone]) => (
          <div className="legend-item" key={id}>
            <span className="dot" style={{ background: zone.color }} />
            {zone.name}
          </div>
        ))}
    </div>
  )
}
