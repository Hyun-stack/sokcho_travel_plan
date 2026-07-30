import { useCallback, useMemo, useState } from 'react'

function storageKey(destinationId: string) {
  return `favs:${destinationId}`
}

function loadFavorites(destinationId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(destinationId)) || '[]')
  } catch {
    return []
  }
}

export function useFavorites(destinationId: string) {
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(destinationId))
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const isFav = useCallback((id: string) => favoriteSet.has(id), [favoriteSet])

  const toggleFav = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(storageKey(destinationId), JSON.stringify(next))
        return next
      })
    },
    [destinationId],
  )

  return { favorites, isFav, toggleFav }
}
