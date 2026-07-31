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

function getExistingEnvs(destinationId: string): string[] {
  const envSet = new Set<string>()

  // 1. 등록된 환경 목록 로드
  try {
    const savedList = JSON.parse(localStorage.getItem(`env:list:${destinationId}`) || '[]')
    if (Array.isArray(savedList)) {
      savedList.forEach((e) => {
        if (typeof e === 'string' && e.trim()) envSet.add(e.trim())
      })
    }
  } catch {}

  // 2. LocalStorage 스캔하여 등록되지 않은 환경 자동 감지 (하위 호환성 및 데이터 안정성용)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const parts = key.split(':')
      if (parts[0] === 'env' && parts.length >= 4) {
        const destId = parts.slice(3).join(':')
        if (destId === destinationId) {
          envSet.add(parts[1])
        }
      }
    }
  }

  return Array.from(envSet).sort()
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
  const [envInput, setEnvInput] = useState('')
  const [envList, setEnvList] = useState<string[]>(() => getExistingEnvs(destinationId))
  const [exportText, setExportText] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [importText, setImportText] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  
  // 이름 변경 관련 상태
  const [editingEnv, setEditingEnv] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')

  const rootRef = useRef<HTMLDivElement>(null)

  // 바깥 영역 클릭 시 드롭다운 닫기
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

  // 탭 전환 또는 닫힐 때 피드백 초기화
  useEffect(() => {
    setFeedback(null)
    setExportText('')
    setShowJson(false)
    setImportText('')
    setEnvInput('')
    setEditingEnv(null)
    setEditInput('')
    // 목록 새로고침
    setEnvList(getExistingEnvs(destinationId))
  }, [activeTab, open, destinationId])

  const stats = getStats(destinationId, env)

  // 환경 추가 (저장 및 환경 등록 용도)
  function handleAddEnv() {
    const trimmed = envInput.trim()
    if (!trimmed) {
      setFeedback({ type: 'error', msg: '추가할 환경 이름을 입력해주세요.' })
      return
    }
    if (trimmed.includes(':')) {
      setFeedback({ type: 'error', msg: '환경 이름에 콜론(:) 문자는 포함할 수 없습니다.' })
      return
    }
    
    // 목록 업데이트 및 등록
    const currentList = getExistingEnvs(destinationId)
    if (!currentList.includes(trimmed)) {
      const updatedList = [...currentList, trimmed].sort()
      localStorage.setItem(`env:list:${destinationId}`, JSON.stringify(updatedList))
      setEnvList(updatedList)
    }

    setFeedback({ type: 'success', msg: `'${trimmed}' 환경이 생성되었습니다. 활성화하는 중...` })
    setEnvInput('')
    
    // 바로 활성화 처리 및 새로고침
    onEnvChange(trimmed)
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  // 환경 전환
  function handleSwitchEnv(name: string) {
    if (name === env) return
    onEnvChange(name)
    setFeedback({ type: 'success', msg: `'${name || '기본값'}' 환경으로 전환합니다. 새로고침 중...` })
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // 환경 이름 변경
  function handleRenameEnv(oldName: string, newNameInput: string) {
    const trimmed = newNameInput.trim()
    if (!trimmed) {
      setFeedback({ type: 'error', msg: '변경할 환경 이름을 입력해주세요.' })
      return
    }
    if (trimmed === oldName) {
      setEditingEnv(null)
      return
    }
    if (trimmed.includes(':')) {
      setFeedback({ type: 'error', msg: '환경 이름에 콜론(:) 문자는 포함할 수 없습니다.' })
      return
    }
    
    const currentList = getExistingEnvs(destinationId)
    if (currentList.includes(trimmed)) {
      setFeedback({ type: 'error', msg: '이미 존재하는 환경 이름입니다.' })
      return
    }

    // 1. LocalStorage의 기존 키들 백업 및 삭제, 새 키에 복사
    const oldKeys = keysFor(destinationId, oldName)
    const newKeys = keysFor(destinationId, trimmed)

    const favData = localStorage.getItem(oldKeys.favKey)
    const routeData = localStorage.getItem(oldKeys.routeKey)
    const visitedData = localStorage.getItem(oldKeys.visitedKey)

    // 새 키에 데이터 이동
    if (favData !== null) localStorage.setItem(newKeys.favKey, favData)
    if (routeData !== null) localStorage.setItem(newKeys.routeKey, routeData)
    if (visitedData !== null) localStorage.setItem(newKeys.visitedKey, visitedData)

    // 기존 키 삭제
    localStorage.removeItem(oldKeys.favKey)
    localStorage.removeItem(oldKeys.routeKey)
    localStorage.removeItem(oldKeys.visitedKey)

    // 2. 등록된 환경 목록 업데이트
    const updatedList = currentList.map(item => item === oldName ? trimmed : item).sort()
    localStorage.setItem(`env:list:${destinationId}`, JSON.stringify(updatedList))
    setEnvList(updatedList)
    setEditingEnv(null)

    // 3. 만약 변경된 환경이 현재 활성 상태였던 경우 활성 환경 이름도 변경 및 페이지 리로드
    if (env === oldName) {
      onEnvChange(trimmed)
      setFeedback({ type: 'success', msg: `활성 환경의 이름이 '${trimmed}'(으)로 변경되었습니다. 새로고침 중...` })
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } else {
      setFeedback({ type: 'success', msg: `'${oldName}' 환경의 이름이 '${trimmed}'(으)로 변경되었습니다.` })
    }
  }

  // 환경 데이터 삭제
  function handleDeleteEnv(name: string, e: React.MouseEvent) {
    e.stopPropagation() // 부모 클릭 전파 방지
    if (!name) return

    const confirmDelete = window.confirm(`'${name}' 환경의 모든 데이터(즐겨찾기, 경로, 방문 표시)가 영구적으로 삭제됩니다. 정말 삭제하시겠습니까?`)
    if (!confirmDelete) return

    const { favKey, routeKey, visitedKey } = keysFor(destinationId, name)
    localStorage.removeItem(favKey)
    localStorage.removeItem(routeKey)
    localStorage.removeItem(visitedKey)

    // 등록 목록에서 제거
    const currentList = getExistingEnvs(destinationId)
    const updatedList = currentList.filter(item => item !== name)
    localStorage.setItem(`env:list:${destinationId}`, JSON.stringify(updatedList))
    setEnvList(updatedList)

    // 만약 현재 활성화된 환경을 삭제했다면 기본 환경으로 전환
    if (env === name) {
      onEnvChange('')
      setFeedback({ type: 'success', msg: `'${name}' 환경이 삭제되었습니다. 기본 환경으로 복귀하여 새로고침합니다.` })
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      setFeedback({ type: 'success', msg: `'${name}' 환경 데이터가 삭제되었습니다.` })
    }
  }

  // 내보내기
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

  // 가져오기
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
        // 병합 (기존 데이터와 합치기)
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

      // 가져온 타겟 환경명을 목록에도 등록
      if (targetEnv) {
        const currentList = getExistingEnvs(destinationId)
        if (!currentList.includes(targetEnv)) {
          const updatedList = [...currentList, targetEnv].sort()
          localStorage.setItem(`env:list:${destinationId}`, JSON.stringify(updatedList))
        }
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

  return (
    <div className="env-share" ref={rootRef}>
      <button
        type="button"
        className={`tb-btn ${open ? 'on' : ''}`}
        title={`환경 공유 및 선택 (현재: ${env || '기본'})`}
        onClick={() => setOpen((s) => !s)}
      >
        🌐
      </button>
      
      {open && (
        <div className="env-share-dropdown">
          <div className="env-share-header">
            <h3>🌐 여행 환경 관리 및 선택</h3>
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
              ⚙️ 환경 선택 & 관리
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
                <span className="env-badge-label">현재 선택된 환경</span>
                <span className="env-badge-value">{env || '기본값'}</span>
              </div>

              {/* Environment List Selection */}
              <div className="env-section">
                <span className="env-section-title">목록에서 환경 선택</span>
                <div className="env-list">
                  {/* Default environment */}
                  <div className={`env-list-item ${env === '' ? 'active' : ''}`} onClick={() => handleSwitchEnv('')}>
                    <span className="env-item-name">🌐 기본값 (Default)</span>
                    {env === '' && <span className="env-item-badge">활성</span>}
                  </div>
                  {/* Custom environments */}
                  {envList.map((name) => {
                    const isActive = env === name
                    const isEditing = editingEnv === name
                    
                    return (
                      <div
                        key={name}
                        className={`env-list-item ${isActive ? 'active' : ''}`}
                        onClick={() => !isEditing && handleSwitchEnv(name)}
                      >
                        {isEditing ? (
                          <div className="env-edit-group" style={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="env-edit-input"
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameEnv(name, editInput)
                                if (e.key === 'Escape') setEditingEnv(null)
                              }}
                            />
                            <button
                              type="button"
                              className="env-btn env-btn-success env-btn-sm"
                              onClick={() => handleRenameEnv(name, editInput)}
                              title="저장"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              className="env-btn env-btn-secondary env-btn-sm"
                              onClick={() => setEditingEnv(null)}
                              title="취소"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="env-item-name" title={name}>📁 {name}</span>
                            <div className="env-item-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {isActive && <span className="env-item-badge">활성</span>}
                              
                              <button
                                type="button"
                                className="env-item-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingEnv(name)
                                  setEditInput(name)
                                }}
                                title="이름 변경"
                              >
                                ✏️
                              </button>

                              {!isActive && (
                                <button
                                  type="button"
                                  className="env-item-delete"
                                  onClick={(e) => handleDeleteEnv(name, e)}
                                  title="이 환경의 모든 데이터 삭제"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add New Environment */}
              <div className="env-section" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span className="env-section-title">새 환경 생성 및 저장</span>
                <div className="env-input-group">
                  <input
                    type="text"
                    placeholder="새 환경 이름 입력..."
                    value={envInput}
                    onChange={(e) => setEnvInput(e.target.value)}
                  />
                  <button type="button" className="env-btn env-btn-primary env-btn-sm" onClick={handleAddEnv}>
                    생성
                  </button>
                </div>
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
