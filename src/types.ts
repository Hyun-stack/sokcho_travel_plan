export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  zone: number
  category: string
}

export interface ZoneInfo {
  color: string
  name: string
}

export interface DestinationData {
  id: string
  title: string
  subtitle: string
  center: [number, number]
  defaultZoom: number
  zones: Record<string, ZoneInfo>
  places: Place[]
}
