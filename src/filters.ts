import { Place } from './types'

export type ViewMode = 'all' | 'fav' | 'route'

export const VIEW_MODE_ORDER: ViewMode[] = ['all', 'fav', 'route']

export const VIEW_MODE_ICON: Record<ViewMode, string> = {
  all: '👁️',
  fav: '⭐',
  route: '🚩',
}

export const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  all: '기본',
  fav: '즐겨찾기만 보기',
  route: '경로 지정 보기',
}

export function nextViewMode(mode: ViewMode): ViewMode {
  return VIEW_MODE_ORDER[(VIEW_MODE_ORDER.indexOf(mode) + 1) % VIEW_MODE_ORDER.length]
}

export interface PlaceFilters {
  viewMode: ViewMode
  selectedCategories: string[]
  hiddenZones: number[]
}

export function matchesFilters(
  place: Place,
  filters: PlaceFilters,
  isFav: (id: string) => boolean,
  isInRoute: (id: string) => boolean,
): boolean {
  if (filters.viewMode === 'fav' && !isFav(place.id)) return false
  if (filters.viewMode === 'route' && !isInRoute(place.id)) return false
  if (filters.hiddenZones.includes(place.zone)) return false
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
