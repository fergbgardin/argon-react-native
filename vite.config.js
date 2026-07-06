import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy the Supabase local API through the same origin the app is served
// from. This way the app works identically from localhost, a LAN IP, or a
// tunnel domain (ngrok etc.) without ever touching this file or .env again —
// see src/lib/supabase.js, which points at window.location.origin in dev.
const SUPABASE_LOCAL_API = 'http://127.0.0.1:54321'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Free static ngrok domain used for mobile testing (Google OAuth needs a
    // real public domain, not a LAN IP) — see supabase/config.toml.
    allowedHosts: ['mullets-scuff-parsley.ngrok-free.dev'],
    proxy: {
      '/auth': SUPABASE_LOCAL_API,
      '/rest': SUPABASE_LOCAL_API,
      '/storage': SUPABASE_LOCAL_API,
      '/functions': SUPABASE_LOCAL_API,
      '/graphql': SUPABASE_LOCAL_API,
      '/realtime': { target: SUPABASE_LOCAL_API, ws: true },
    }
  }
})
