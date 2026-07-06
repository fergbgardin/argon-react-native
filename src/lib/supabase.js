import { createClient } from '@supabase/supabase-js'

// In dev, always talk to the API through the same origin the app was loaded
// from — vite.config.js proxies it to the local Supabase stack. That makes
// the app work identically from localhost, a LAN IP, or a tunnel domain
// without ever touching this file or .env again.
const supabaseUrl = import.meta.env.DEV
  ? window.location.origin
  : import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Prevents ngrok's free-tier browser-warning interstitial from ever
  // intercepting API calls when testing through a tunnel domain — harmless
  // no-op against localhost/LAN/production.
  global: { headers: { 'ngrok-skip-browser-warning': 'true' } },
})

export const isConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
