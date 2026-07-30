import { useCallback, useMemo, useState } from 'react'

function storageKey(destinationId: string) {
  return `visited:${destinationId}`
}

function loadVisited(destinationId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(destinationId)) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function useVisited(destinationId: string) {
  const [visited, setVisited] = useState<string[]>(() => loadVisited(destinationId))
  const visitedSet = useMemo(() => new Set(visited), [visited])

  const isVisited = useCallback((id: string) => visitedSet.has(id), [visitedSet])

  const toggleVisited = useCallback(
    (id: string) => {
      setVisited((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        localStorage.setItem(storageKey(destinationId), JSON.stringify(next))
        return next
      })
    },
    [destinationId],
  )

  return { visited, isVisited, toggleVisited }
}
