import { useCallback, useEffect, useMemo, useState } from 'react'

function storageKey(destinationId: string, env?: string) {
  return env && env.length > 0 ? `env:${env}:route:${destinationId}` : `route:${destinationId}`
}

function loadRoute(destinationId: string, env?: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(destinationId, env)) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function useRoute(destinationId: string, env?: string) {
  const [routeOrder, setRouteOrder] = useState<string[]>(() => loadRoute(destinationId, env))

  useEffect(() => {
    setRouteOrder(loadRoute(destinationId, env))
  }, [destinationId, env])

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
        localStorage.setItem(storageKey(destinationId, env), JSON.stringify(next))
        return next
      })
    },
    [destinationId, env],
  )

  const clearRoute = useCallback(() => {
    localStorage.setItem(storageKey(destinationId, env), '[]')
    setRouteOrder([])
  }, [destinationId, env])

  return { routeOrder, isInRoute, routeIndex, toggleRoute, clearRoute }
}
