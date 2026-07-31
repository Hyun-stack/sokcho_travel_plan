import { useCallback, useEffect, useMemo, useState } from 'react'

function storageKey(destinationId: string, env?: string) {
  return env && env.length > 0 ? `env:${env}:visited:${destinationId}` : `visited:${destinationId}`
}

function loadVisited(destinationId: string, env?: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(destinationId, env)) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function useVisited(destinationId: string, env?: string) {
  const [visited, setVisited] = useState<string[]>(() => loadVisited(destinationId, env))
  const visitedSet = useMemo(() => new Set(visited), [visited])

  useEffect(() => {
    setVisited(loadVisited(destinationId, env))
  }, [destinationId, env])

  const isVisited = useCallback((id: string) => visitedSet.has(id), [visitedSet])

  const toggleVisited = useCallback(
    (id: string) => {
      setVisited((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(storageKey(destinationId, env), JSON.stringify(next))
        return next
      })
    },
    [destinationId, env],
  )

  return { visited, isVisited, toggleVisited }
}
