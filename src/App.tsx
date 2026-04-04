import { useState } from 'react'
import { MapView } from './components/MapView'
import { ChaserManagement } from './components/ChaserManagement'
import { ChaserDetail } from './components/ChaserDetail'
import { Auth } from './components/Auth'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { signOut } from './lib/auth'
import type { Database } from './lib/database.types'
import './App.css'

type Chaser = Database['public']['Tables']['chasers']['Row']
type ChaserLocation = Database['public']['Tables']['chaser_locations']['Row']

interface ChaserWithLocation extends Chaser {
  location?: ChaserLocation
}

function AppContent() {
  const { user, userRole, loading, isModerator } = useAuth()
  const [showManagement, setShowManagement] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [selectedChaser, setSelectedChaser] = useState<ChaserWithLocation | null>(null)

  async function handleSignOut() {
    await signOut()
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Storm Chaser Tracker</h1>
        <div className="header-actions">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                {userRole && (
                  <span className="user-role">{userRole.role}</span>
                )}
              </div>
              {isModerator && (
                <button
                  className="btn-primary"
                  onClick={() => setShowManagement(true)}
                >
                  Manage Chasers
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setShowAuth(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <MapView onChaserClick={setSelectedChaser} />
      </main>

      {showAuth && !user && (
        <Auth
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}

      {showManagement && isModerator && (
        <ChaserManagement onClose={() => setShowManagement(false)} />
      )}

      {selectedChaser && (
        <ChaserDetail
          chaser={selectedChaser}
          onClose={() => setSelectedChaser(null)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
