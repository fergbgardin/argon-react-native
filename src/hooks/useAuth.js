import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useAuth() {
  // undefined = loading, null = no session, object = authenticated
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!isConfigured) {
      setSession(null) // skip auth in mock mode
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading: session === undefined }
}

// Extract display-friendly profile info from a Supabase user
export function getProfile(user) {
  const meta = user?.user_metadata || {}
  const fullName = meta.full_name || meta.name || user?.email?.split('@')[0] || 'Usuário'
  const firstName = fullName.split(' ')[0]
  const avatar = meta.avatar_url || meta.picture || null
  const email = user?.email || ''
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return { fullName, firstName, avatar, email, initials }
}
