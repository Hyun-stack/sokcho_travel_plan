export function buildNaverMapWebUrl(name: string, lat: number, lng: number) {
  const dname = encodeURIComponent(name)
  return `https://map.naver.com/p/directions/-/-/-/${lng},${lat},${dname}/walk`
}

/**
 * Tries to open the Naver Map app via its custom URL scheme. On mobile, if the
 * app doesn't take over within the timeout (likely not installed), calls
 * `onFallbackNeeded` with the web URL instead of navigating automatically —
 * auto-navigating the current window causes UI glitches in home-screen/PWA
 * standalone mode, and calling window.open() from a timer (not a user
 * gesture) can get blocked as a popup.
 */
export function openNaverMapDirections(
  name: string,
  lat: number,
  lng: number,
  onFallbackNeeded?: (webUrl: string) => void,
) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const appName = encodeURIComponent(location.hostname || 'sokcho-travel-plan')
  const dname = encodeURIComponent(name)
  const webUrl = buildNaverMapWebUrl(name, lat, lng)

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
  window.addEventListener('blur', onHide, { once: true })

  window.location.href = scheme

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onHide)
    window.removeEventListener('blur', onHide)
    if (!fellBackOrLeft && !document.hidden) {
      onFallbackNeeded?.(webUrl)
    }
  }, 1500)
}
