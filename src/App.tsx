import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

function Dashboard({ session }: { session: Session | null }) {
  return (
    <main className="splash">
      <h1>BioPlot</h1>
      <p>Scientific visualization workspace</p>
      <button>Create new project</button>
      <p>{session ? 'Signed in' : 'Guest workspace'}</p>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session)
      })
      .catch(() => {
        if (mounted) setSession(null)
      })
      .finally(() => {
        if (mounted) setReady(true)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) setSession(next)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (!ready) return <div className="splash">Loading BioPlot...</div>

  return <Dashboard session={session} />
}
