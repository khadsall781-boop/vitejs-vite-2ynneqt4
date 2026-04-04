import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { getUserRole } from '../lib/auth'
import type { User } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

type UserRole = Database['public']['Tables']['user_roles']['Row']

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  isAuthenticated: boolean
  isModerator: boolean
  isChaser: boolean
  isViewer: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAuthenticated: false,
  isModerator: false,
  isChaser: false,
  isViewer: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserRole()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserRole()
        } else {
          setUserRole(null)
          setLoading(false)
        }
      })()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserRole() {
    const role = await getUserRole()
    setUserRole(role)
    setLoading(false)
  }

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    isAuthenticated: !!user,
    isModerator: userRole?.role === 'moderator',
    isChaser: userRole?.role === 'chaser',
    isViewer: userRole?.role === 'viewer',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
