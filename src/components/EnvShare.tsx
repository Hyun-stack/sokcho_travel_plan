import { useState } from 'react'

interface EnvShareProps {
  destinationId: string
  env: string
  onEnvChange: (v: string) => void
}

function keysFor(destinationId: string, env?: string) {
  const favKey = env && env.length > 0 ? `env:${env}:favs:${destinationId}` : `favs:${destinationId}`
  const routeKey = env && env.length > 0 ? `env:${env}:route:${destinationId}` : `route:${destinationId}`
  return { favKey, routeKey }
}

export default function EnvShare({ destinationId, env, onEnvChange }: EnvShareProps) {
  const [open, setOpen] = useState(false)
  const [envInput, setEnvInput] = useState(env)
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')

  function doExport() {
    const { favKey, routeKey } = keysFor(destinationId, env)
    let favs: string[] = []
    let route: string[] = []
    try {
      favs = JSON.parse(localStorage.getItem(favKey) || '[]')
    } catch {}
    try {
      route = JSON.parse(localStorage.getItem(routeKey) || '[]')
    } catch {}
    const payload = { env, favs, route }
    const json = JSON.stringify(payload, null, 2)
    setExportText(json)
    try {
      navigator.clipboard.writeText(json)
    } catch {}
  }

  function doImport(applyOverwrite: boolean) {
    try {
      const parsed = JSON.parse(importText)
      const targetEnv = typeof parsed.env === 'string' ? parsed.env : env
      const target = keysFor(destinationId, targetEnv)
      const favs = Array.isArray(parsed.favs) ? parsed.favs : []
      const route = Array.isArray(parsed.route) ? parsed.route : []
      if (applyOverwrite) {
        localStorage.setItem(target.favKey, JSON.stringify(favs))
        localStorage.setItem(target.routeKey, JSON.stringify(route))
      } else {
        // merge: read existing then union
        try {
          const existingFavs = JSON.parse(localStorage.getItem(target.favKey) || '[]')
          const mergedFavs = Array.from(new Set([...(existingFavs || []), ...favs]))
          localStorage.setItem(target.favKey, JSON.stringify(mergedFavs))
        } catch {}
        try {
          const existingRoute = JSON.parse(localStorage.getItem(target.routeKey) || '[]')
          // prefer imported route if non-empty
          const finalRoute = (route && route.length > 0) ? route : existingRoute
          localStorage.setItem(target.routeKey, JSON.stringify(finalRoute || []))
        } catch {}
      }
      onEnvChange(targetEnv)
      // optional: reload to let hooks pick up new data
      window.location.reload()
    } catch (e) {
      // invalid JSON
      // noop
    }
  }

  return (
    <div className="env-share">
      <button
        type="button"
        className="tb-btn"
        title="환경 공유"
        onClick={() => setOpen((s) => !s)}
      >
        🌐
      </button>
      {open && (
        <div className="env-share-dropdown">
          <div style={{ marginBottom: 8 }}>
            <label>환경 이름 (비워두면 기본)</label>
            <div className="row" style={{ marginTop: 6 }}>
              <input type="text" value={envInput} onChange={(e) => setEnvInput(e.target.value)} />
              <button onClick={() => { onEnvChange(envInput); setOpen(false) }}>설정</button>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>현재: {env || '(기본)'}</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <button onClick={doExport}>현재 환경 내보내기 (클립보드에 복사)</button>
            <textarea readOnly value={exportText} style={{ width: '100%', height: 80, marginTop: 6 }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>가져오기 (JSON 붙여넣기)</label>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} style={{ width: '100%', height: 120, marginTop: 6 }} />
            <div className="actions">
              <button onClick={() => doImport(true)}>가져와서 덮어쓰기 (권장)</button>
              <button onClick={() => doImport(false)}>가져와서 병합</button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button onClick={() => setOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
