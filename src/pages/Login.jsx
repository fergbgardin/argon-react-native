import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.2 7.3-10.5 7.3-17.4z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.6v6.2C6.5 42.6 14.7 48 24 48z" />
      <path fill="#FBBC05" d="M10.8 28.8c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8v-6.2H2.6C1 16.4 0 20.1 0 24s1 7.6 2.6 10.9l8.2-6.1z" />
      <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.4 0 24 0 14.7 0 6.5 5.4 2.6 13.1l8.2 6.2C12.7 13.6 17.9 9.5 24 9.5z" />
    </svg>
  )
}

export default function Login() {
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center gap-10 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🖋️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">InkManager</h1>
          <p className="text-sm text-muted text-center">Gestão para tatuadores</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#1A1A1A] font-medium rounded-xl px-4 py-3.5 text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Entrar com Google
          </button>
        </div>

        <p className="text-xs text-muted text-center">
          Ao entrar você concorda com o uso desta plataforma para fins de teste.
        </p>
      </div>
    </div>
  )
}
