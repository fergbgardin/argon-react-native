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

  return { session, loading: session === undefined }
}
