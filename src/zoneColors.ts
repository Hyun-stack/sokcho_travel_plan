import { ZoneInfo } from './types'

export function assignZoneColors(
  rawZones: Record<string, { name: string }>,
): Record<string, ZoneInfo> {
  const ids = Object.keys(rawZones)
  const count = ids.length
  const result: Record<string, ZoneInfo> = {}
  ids.forEach((id, index) => {
    const hue = Math.round((360 / count) * index)
    result[id] = { name: rawZones[id].name, color: `hsl(${hue}, 65%, 42%)` }
  })
  return result
}
