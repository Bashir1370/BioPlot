import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      if (active) {
        setLoading(false)
        setError('Authentication initialization timed out. Please check Supabase settings.')
      }
    }, 5000)

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (active) setSession(data.session)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Auth error')
      } finally {
        window.clearTimeout(timer)
        if (active) setLoading(false)
      }
    }

    void init()
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next)
    })

    return () => {
      active = false
      window.clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div className="splash">Preparing BioPlot workspace…</div>

  if (error) return <div className="splash"><h2>BioPlot setup issue</h2><p>{error}</p></div>

  return <div className="splash"><h1>BioPlot</h1><p>{session ? 'Dashboard loading...' : 'Authentication ready'}</p></div>
}
