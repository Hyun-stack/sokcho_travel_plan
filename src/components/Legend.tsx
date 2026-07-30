import { ZoneInfo } from '../types'

interface LegendProps {
  zones: Record<string, ZoneInfo>
  expanded: boolean
}

export default function Legend({ zones, expanded }: LegendProps) {
  return (
    <div className="legend" style={{ bottom: expanded ? 'calc(50vh + 12px)' : '60px' }}>
      <div className="legend-title">권역별 안내</div>
      {Object.entries(zones).map(([id, zone]) => (
        <div className="legend-item" key={id}>
          <span className="dot" style={{ background: zone.color }} />
          {zone.name}
        </div>
      ))}
    </div>
  )
}
