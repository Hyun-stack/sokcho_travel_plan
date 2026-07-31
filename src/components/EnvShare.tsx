import { useState, useEffect, useRef } from 'react'

interface EnvShareProps {
  destinationId: string
  env: string
  onEnvChange: (v: string) => void
}

function keysFor(destinationId: string, env?: string) {
  const favKey = env && env.length > 0 ? `env:${env}:favs:${destinationId}` : `favs:${destinationId}`
  const routeKey = env && env.length > 0 ? `env:${env}:route:${destinationId}` : `route:${destinationId}`
  const visitedKey = env && env.length > 0 ? `env:${env}:visited:${destinationId}` : `visited:${destinationId}`
  return { favKey, routeKey, visitedKey }
}

function getStats(destinationId: string, env: string) {
  const { favKey, routeKey, visitedKey } = keysFor(destinationId, env)
  let favCount = 0
  let routeCount = 0
  let visitedCount = 0
  try {
    favCount = JSON.parse(localStorage.getItem(favKey) || '[]').length
  } catch {}
  try {
    routeCount = JSON.parse(localStorage.getItem(routeKey) || '[]').length
  } catch {}
  try {
    visitedCount = JSON.parse(localStorage.getItem(visitedKey) || '[]').length
  } catch {}
  return { favCount, routeCount, visitedCount }
}

export default function EnvShare({ destinationId, env, onEnvChange }: EnvShareProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'import'>('settings')
  const [envInput, setEnvInput] = useState(env)
  const [exportText, setExportText] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [importText, setImportText] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  
  const rootRef = useRef<HTMLDivElement>(null)

  // Sync envInput with env prop when it changes
  useEffect(() => {
    setEnvInput(env)
  }, [env])

  // Click outside to close dropdown
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Clear feedback when switching tabs or closing
  useEffect(() => {
    setFeedback(null)
    setExportText('')
    setShowJson(false)
  }, [activeTab, open])

  const stats = getStats(destinationId, env)

  function doExport() {
    const { favKey, routeKey, visitedKey } = keysFor(destinationId, env)
    let favs: string[] = []
    let route: string[] = []
    let visited: string[] = []
    try {
      favs = JSON.parse(localStorage.getItem(favKey) || '[]')
    } catch {}
    try {
      route = JSON.parse(localStorage.getItem(routeKey) || '[]')
    } catch {}
    try {
      visited = JSON.parse(localStorage.getItem(visitedKey) || '[]')
    } catch {}
    
    const payload = { env, favs, route, visited }
    const json = JSON.stringify(payload, null, 2)
    setExportText(json)
    
    try {
      navigator.clipboard.writeText(json)
      setFeedback({ type: 'success', msg: '클립보드에 데이터가 복사되었습니다!' })
    } catch (err) {
      setFeedback({ type: 'error', msg: '클립보드 복사에 실패했습니다. 아래 텍스트를 수동으로 복사하세요.' })
      setShowJson(true)
    }
  }

  function doImport(applyOverwrite: boolean) {
    if (!importText.trim()) {
      setFeedback({ type: 'error', msg: '가져올 JSON 데이터를 입력해주세요.' })
      return
    }
    try {
      const parsed = JSON.parse(importText)
      const targetEnv = typeof parsed.env === 'string' ? parsed.env : env
      const target = keysFor(destinationId, targetEnv)
      
      const favs = Array.isArray(parsed.favs) ? parsed.favs : []
      const route = Array.isArray(parsed.route) ? parsed.route : []
      const visited = Array.isArray(parsed.visited) ? parsed.visited : []
      
      if (applyOverwrite) {
        localStorage.setItem(target.favKey, JSON.stringify(favs))
        localStorage.setItem(target.routeKey, JSON.stringify(route))
        localStorage.setItem(target.visitedKey, JSON.stringify(visited))
      } else {
        // merge: read existing then union
        try {
          const existingFavs = JSON.parse(localStorage.getItem(target.favKey) || '[]')
          const mergedFavs = Array.from(new Set([...(existingFavs || []), ...favs]))
          localStorage.setItem(target.favKey, JSON.stringify(mergedFavs))
        } catch {}
        try {
          const existingRoute = JSON.parse(localStorage.getItem(target.routeKey) || '[]')
          const finalRoute = (route && route.length > 0) ? route : existingRoute
          localStorage.setItem(target.routeKey, JSON.stringify(finalRoute || []))
        } catch {}
        try {
          const existingVisited = JSON.parse(localStorage.getItem(target.visitedKey) || '[]')
          const mergedVisited = Array.from(new Set([...(existingVisited || []), ...visited]))
          localStorage.setItem(target.visitedKey, JSON.stringify(mergedVisited))
        } catch {}
      }
      
      setFeedback({ type: 'success', msg: '데이터를 성공적으로 가져왔습니다. 잠시 후 새로고침됩니다.' })
      onEnvChange(targetEnv)
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (e) {
      setFeedback({ type: 'error', msg: '올바른 JSON 형식이 아닙니다. 형식을 확인해주세요.' })
    }
  }

  function handleSaveEnv() {
    onEnvChange(envInput)
    setFeedback({ type: 'success', msg: `환경 이름이 '${envInput || '기본'}'(으)로 변경되었습니다.` })
  }

  return (
    <div className="env-share" ref={rootRef}>
      <button
        type="button"
        className={`tb-btn ${env ? 'on' : ''}`}
        title={`환경 공유 (현재: ${env || '기본'})`}
        onClick={() => setOpen((s) => !s)}
      >
        🌐
      </button>
      
      {open && (
        <div className="env-share-dropdown">
          <div className="env-share-header">
            <h3>⚙️ 여행 환경 설정 및 공유</h3>
            <button type="button" className="env-share-close" onClick={() => setOpen(false)} title="닫기">
              ✕
            </button>
          </div>

          <div className="env-share-tabs">
            <button
              type="button"
              className={`env-share-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ 설정 & 내보내기
            </button>
            <button
              type="button"
              className={`env-share-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              📥 가져오기
            </button>
          </div>

          {activeTab === 'settings' ? (
            <div className="env-share-tab-content">
              {/* Active environment status */}
              <div className="env-badge-container">
                <span className="env-badge-label">현재 활성화된 환경</span>
                <span className="env-badge-value">{env || '기본값'}</span>
              </div>

              {/* Env name modification */}
              <div className="env-section">
                <span className="env-section-title">환경 이름 지정</span>
                <div className="env-input-group">
                  <input
                    type="text"
                    placeholder="예: sokcho-trip-1"
                    value={envInput}
                    onChange={(e) => setEnvInput(e.target.value)}
                  />
                  <button type="button" className="env-btn env-btn-primary env-btn-sm" onClick={handleSaveEnv}>
                    설정
                  </button>
                </div>
                <span className="env-info-text">
                  서로 다른 환경명을 사용해 여러 개의 여행 계획(즐겨찾기, 경로 등)을 분리하여 관리할 수 있습니다.
                </span>
              </div>

              {/* Export */}
              <div className="env-section" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span className="env-section-title">현재 환경 내보내기</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="env-info-text" style={{ fontWeight: 600, color: '#475569' }}>
                    📦 즐겨찾기 {stats.favCount}개 | 경로 {stats.routeCount}개 | 방문 {stats.visitedCount}개
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="env-btn env-btn-success" style={{ flex: 1 }} onClick={doExport}>
                      📋 클립보드 복사
                    </button>
                    <button
                      type="button"
                      className="env-btn env-btn-secondary env-btn-sm"
                      onClick={() => setShowJson(!showJson)}
                    >
                      {showJson ? 'JSON 숨기기' : 'JSON 보기'}
                    </button>
                  </div>
                </div>
                {showJson && (
                  <textarea
                    readOnly
                    value={exportText || '복사 버튼을 누르면 JSON 데이터가 여기에 나타납니다.'}
                    style={{ width: '100%', height: '100px', marginTop: '6px' }}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="env-share-tab-content">
              {/* Import */}
              <div className="env-section">
                <span className="env-section-title">가져올 데이터 (JSON) 붙여넣기</span>
                <textarea
                  placeholder='{"env": "sokcho-trip-1", "favs": [...], "route": [...], "visited": [...]}'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  style={{ width: '100%', height: '120px' }}
                />
              </div>
              <div className="env-info-text">
                가져오기 시 데이터 반영을 위해 자동으로 페이지가 새로고침됩니다.
              </div>
              <div className="actions" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="env-btn env-btn-warning"
                  style={{ flex: 1 }}
                  onClick={() => doImport(false)}
                >
                  ➕ 병합해서 가져오기
                </button>
                <button
                  type="button"
                  className="env-btn env-btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => doImport(true)}
                >
                  ⚠️ 덮어쓰며 가져오기
                </button>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {feedback && (
            <div className={`env-${feedback.type}-msg`} style={{ marginTop: '8px' }}>
              {feedback.type === 'success' ? '✓' : '⚠️'} {feedback.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
