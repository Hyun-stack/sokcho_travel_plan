import { useCallback, useEffect, useMemo, useState } from 'react'

function storageKey(destinationId: string, env?: string) {
  return env && env.length > 0 ? `env:${env}:favs:${destinationId}` : `favs:${destinationId}`
}

function loadFavorites(destinationId: string, env?: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(destinationId, env)) || '[]')
  } catch {
    return []
  }
}

export function useFavorites(destinationId: string, env?: string) {
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(destinationId, env))
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  useEffect(() => {
    setFavorites(loadFavorites(destinationId, env))
  }, [destinationId, env])

  const isFav = useCallback((id: string) => favoriteSet.has(id), [favoriteSet])

  const toggleFav = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(storageKey(destinationId, env), JSON.stringify(next))
        return next
      })
    },
    [destinationId, env],
  )

  return { favorites, isFav, toggleFav }
}
