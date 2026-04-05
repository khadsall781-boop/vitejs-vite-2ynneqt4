import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapView } from './components/MapView';
import { ChaserManagement } from './components/ChaserManagement';
import { ChaserDetail } from './components/ChaserDetail';
import { ProfileEdit } from './components/ProfileEdit';
import './App.css';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">Tornado Tackler</Link>
        </div>
        <div className="nav-links">
          <Link to="/chasers">Storm Chasers</Link>
          <Link to="/profile">My Profile</Link>
          
          {/* Only show Live Map button when on the Chasers page */}
          {location.pathname === '/chasers' && (
            <Link to="/map" className="btn-map">Live Map</Link>
          )}
        </div>
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<ChaserManagement />} />
          <Route path="/chasers" element={<ChaserManagement />} />
          <Route path="/chasers/:id" element={<ChaserDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/profile" element={<ProfileEdit />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;