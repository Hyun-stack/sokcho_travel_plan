import { useEffect, useRef, useState } from 'react'
import { Place } from '../types'

interface SearchBoxProps {
  places: Place[]
  onSelectPlace: (id: string) => void
}

export default function SearchBox({ places, onSelectPlace }: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const trimmed = query.trim().toLowerCase()
  const results = trimmed
    ? places.filter((p) => p.name.toLowerCase().includes(trimmed)).slice(0, 8)
    : []

  function handleSelect(id: string) {
    onSelectPlace(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="search-box" ref={rootRef}>
      <span className="search-icon">🔎</span>
      <input
        type="text"
        placeholder="장소 검색"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && trimmed && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">검색 결과가 없습니다.</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="search-result-item"
                onClick={() => handleSelect(p.id)}
              >
                {p.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
