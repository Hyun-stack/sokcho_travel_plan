export function openNaverMapDirections(name: string, lat: number, lng: number) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const appName = encodeURIComponent(location.hostname || 'sokcho-travel-plan')
  const dname = encodeURIComponent(name)
  const webUrl = `https://map.naver.com/p/directions/-/-/-/${lng},${lat},${dname}/walk`

  if (!isMobile) {
    window.open(webUrl, '_blank', 'noopener')
    return
  }

  const scheme = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${dname}&appname=${appName}`
  let fellBackOrLeft = false
  const onHide = () => {
    fellBackOrLeft = true
  }
  document.addEventListener('visibilitychange', onHide, { once: true })
  window.addEventListener('pagehide', onHide, { once: true })

  window.location.href = scheme

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onHide)
    if (!fellBackOrLeft) {
      window.location.href = webUrl
    }
  }, 1500)
}
