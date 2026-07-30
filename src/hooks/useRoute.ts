import { useCallback, useMemo, useState } from 'react'

function storageKey(destinationId: string) {
  return `route:${destinationId}`
}

function loadRoute(destinationId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(destinationId)) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function useRoute(destinationId: string) {
  const [routeOrder, setRouteOrder] = useState<string[]>(() => loadRoute(destinationId))

  const orderMap = useMemo(() => {
    const map = new Map<string, number>()
    routeOrder.forEach((id, i) => map.set(id, i + 1))
    return map
  }, [routeOrder])

  const isInRoute = useCallback((id: string) => orderMap.has(id), [orderMap])
  const routeIndex = useCallback((id: string) => orderMap.get(id) ?? -1, [orderMap])

  const toggleRoute = useCallback(
    (id: string) => {
      setRouteOrder((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(storageKey(destinationId), JSON.stringify(next))
        return next
      })
    },
    [destinationId],
  )

  const clearRoute = useCallback(() => {
    localStorage.setItem(storageKey(destinationId), '[]')
    setRouteOrder([])
  }, [destinationId])

  return { routeOrder, isInRoute, routeIndex, toggleRoute, clearRoute }
}
