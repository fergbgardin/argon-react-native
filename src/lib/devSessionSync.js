// Dev-only helper to move an authenticated session between devices while
// testing locally (e.g. desktop -> phone on the same LAN), without going
// through OAuth again. Stripped entirely from production builds since every
// branch is gated by import.meta.env.DEV (Vite dead-code-eliminates it).
//
// Usage: visit the app with `#dev-session=<base64 json of localStorage sb-* keys>`
// in the URL. The keys are written to localStorage and the hash is cleared
// before React/Supabase ever read it.
if (import.meta.env.DEV && window.location.hash.startsWith('#dev-session=')) {
  try {
    const encoded = window.location.hash.slice('#dev-session='.length)
    const json = decodeURIComponent(escape(atob(encoded)))
    const data = JSON.parse(json)
    Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value))
  } catch (e) {
    console.error('dev-session import failed', e)
  }
  window.history.replaceState(null, '', window.location.pathname)
}
