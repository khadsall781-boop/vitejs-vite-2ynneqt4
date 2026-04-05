import { useState } from 'react'
import { MapView } from './components/MapView'
import { ChaserManagement } from './components/ChaserManagement'
import './App.css'

function App() {
  const [view, setView] = useState<'map' | 'manage'>('map')

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Tornado Tacklers' Map</h1>
          <nav className="header-actions">
            <button 
              className={view === 'map' ? 'btn-primary' : 'btn-outline'} 
              onClick={() => setView('map')}
            >
              🛰️ Live Map
            </button>
            <button 
              className={view === 'manage' ? 'btn-primary' : 'btn-outline'} 
              onClick={() => setView('manage')}
            >
              ⚙️ Manage Roster
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {view === 'map' ? (
          <MapView />
        ) : (
          <ChaserManagement />
        )}
      </main>
    </div>
  )
}

export default App