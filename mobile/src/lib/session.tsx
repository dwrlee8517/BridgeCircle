import type { Session } from '@supabase/supabase-js'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

type SessionState = {
  session: Session | null
  /** True until the persisted session has been read from AsyncStorage. */
  loading: boolean
}

const SessionContext = createContext<SessionState>({ session: null, loading: true })

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false })
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export function useSession(): SessionState {
  return useContext(SessionContext)
}
