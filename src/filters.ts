import { Place } from './types'

export interface PlaceFilters {
  favOnly: boolean
  selectedZones: number[]
  selectedCategories: string[]
}

export function matchesFilters(
  place: Place,
  filters: PlaceFilters,
  isFav: (id: string) => boolean,
): boolean {
  if (filters.favOnly && !isFav(place.id)) return false
  if (filters.selectedZones.length > 0 && !filters.selectedZones.includes(place.zone)) return false
  if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(place.category))
    return false
  return true
}

const CATEGORY_EMOJI: Record<string, string> = {
  '가성비 한끼': '🍚',
  랜드마크: '🗼',
  '베이커리·이색카페': '🥐',
  빵집: '🍞',
  산책: '🚶',
  '산책/일출': '🌅',
  시장먹거리: '🏪',
  야경: '🌃',
  오션뷰카페: '🌊',
  이색간식: '🍡',
  이색맛집: '🍽️',
  이색카페: '☕',
  '이자카야·술집': '🍶',
  '카페&펍': '🍻',
  테마카페: '🎨',
  파스타양식: '🍝',
  해변: '🏖️',
  해산물튀김: '🍤',
  향토음식: '🥘',
  '호수뷰·산뷰카페': '🏞️',
  호수뷰카페: '🛶',
}

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] || '📍'
}
