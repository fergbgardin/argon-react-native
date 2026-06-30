import { useState, useEffect, useCallback } from 'react'
import { settingsApi } from '../lib/api'

export function useData(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: err } = await fetchFn()
      if (err) throw err
      setData(result)
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}

export function useSettings() {
  const [settings, setSettings] = useState({
    custo_material_pequena: 30,
    custo_material_media: 60,
    custo_material_grande: 100,
    presets_agulhas: ['RL #3', 'RL #5', 'RL #7', 'RL #9', 'RM #5', 'RM #7', 'RS #5'],
    presets_pigmentos: [],
  })

  useEffect(() => {
    settingsApi.get().then(({ data }) => {
      if (data) setSettings(data)
    })
  }, [])

  return settings
}
