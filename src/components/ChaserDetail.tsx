import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { Icon } from 'leaflet'
import type { Database } from '../lib/database.types'

type Chaser = Database['public']['Tables']['chasers']['Row']
type ChaserLocation = Database['public']['Tables']['chaser_locations']['Row']

interface ChaserWithLocation extends Chaser {
  location?: ChaserLocation
}

interface ChaserDetailProps {
  chaser: ChaserWithLocation
  onClose: () => void
}

export function ChaserDetail({ chaser, onClose }: ChaserDetailProps) {
  const [radarUrl, setRadarUrl] = useState<string>('')

  useEffect(() => {
    if (chaser.location) {
      setRadarUrl(`https://radar.weather.gov/ridge/standard/CONUS_loop.gif`)
    }
  }, [chaser])

  const chaserIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}?autoplay=1`
      }
      if (urlObj.hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1)
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      }
      if (urlObj.pathname.includes('/live/')) {
        const videoId = urlObj.pathname.split('/live/')[1]
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      }
    } catch {
      return null
    }
    return null
  }

  const embedUrl = chaser.stream_url ? getYouTubeEmbedUrl(chaser.stream_url) : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="chaser-header">
            {chaser.avatar_url && (
              <img src={chaser.avatar_url} alt={chaser.name} className="chaser-avatar-large" />
            )}
            <div>
              <h2>{chaser.name}</h2>
              <p className="callsign">{chaser.callsign}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="detail-content">
          {chaser.location && (
            <div className="location-info">
              <h3>Current Location</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Coordinates:</span>
                  <span className="value">
                    {chaser.location.latitude.toFixed(6)}, {chaser.location.longitude.toFixed(6)}
                  </span>
                </div>
                {chaser.location.speed !== null && (
                  <div className="info-item">
                    <span className="label">Speed:</span>
                    <span className="value">{chaser.location.speed.toFixed(1)} mph</span>
                  </div>
                )}
                {chaser.location.heading !== null && (
                  <div className="info-item">
                    <span className="label">Heading:</span>
                    <span className="value">{chaser.location.heading}°</span>
                  </div>
                )}
                {chaser.location.altitude !== null && (
                  <div className="info-item">
                    <span className="label">Altitude:</span>
                    <span className="value">{chaser.location.altitude.toFixed(0)} ft</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Last Update:</span>
                  <span className="value">
                    {new Date(chaser.location.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="detail-grid">
            {embedUrl && (
              <div className="stream-container">
                <h3>Live Stream</h3>
                <div className="video-wrapper">
                  <iframe
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${chaser.name} Live Stream`}
                  ></iframe>
                </div>
              </div>
            )}

            {!embedUrl && chaser.stream_url && (
              <div className="stream-container">
                <h3>Live Stream</h3>
                <a href={chaser.stream_url} target="_blank" rel="noopener noreferrer" className="stream-link">
                  Open Stream in New Tab
                </a>
              </div>
            )}

            {chaser.location && (
              <div className="radar-container">
                <h3>Local Map</h3>
                <div className="map-wrapper">
                  <MapContainer
                    center={[chaser.location.latitude, chaser.location.longitude]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[chaser.location.latitude, chaser.location.longitude]}
                      icon={chaserIcon}
                    />
                  </MapContainer>
                </div>
              </div>
            )}

            {radarUrl && (
              <div className="radar-container">
                <h3>Weather Radar</h3>
                <div className="radar-wrapper">
                  <img src={radarUrl} alt="Weather Radar" />
                  <p className="radar-note">
                    Note: For live radar at chaser location, you can integrate services like:
                    Weather.gov, RainViewer, or OpenWeatherMap
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
