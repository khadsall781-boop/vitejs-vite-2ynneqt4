import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Chaser = Database['public']['Tables']['chasers']['Row']
type ChaserLocation = Database['public']['Tables']['chaser_locations']['Row']

interface ChaserWithLocation extends Chaser {
  location?: ChaserLocation
}

interface MapViewProps {
  onChaserClick: (chaser: ChaserWithLocation) => void
}

function MapUpdater({ chasers }: { chasers: ChaserWithLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (chasers.length > 0) {
      const locations = chasers
        .filter(c => c.location)
        .map(c => [c.location!.latitude, c.location!.longitude] as [number, number])

      if (locations.length > 0) {
        map.fitBounds(locations, { padding: [50, 50], maxZoom: 10 })
      }
    }
  }, [chasers, map])

  return null
}

export function MapView({ onChaserClick }: MapViewProps) {
  const [chasers, setChasers] = useState<ChaserWithLocation[]>([])
  const [center] = useState<[number, number]>([39.8283, -98.5795])

  useEffect(() => {
    loadChasers()

    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chaser_locations' },
        () => {
          loadChasers()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chasers' },
        () => {
          loadChasers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadChasers() {
    const { data: chasersData, error: chasersError } = await supabase
      .from('chasers')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (chasersError) {
      console.error('Error loading chasers:', chasersError)
      return
    }

    const chasersWithLocations: ChaserWithLocation[] = await Promise.all(
      (chasersData || []).map(async (chaser: Chaser) => {
        const { data: locationData } = await supabase
          .from('chaser_locations')
          .select('*')
          .eq('chaser_id', chaser.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...chaser,
          location: locationData || undefined,
        } as ChaserWithLocation
      })
    )

    setChasers(chasersWithLocations)
  }

  const chaserIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {chasers.filter(c => c.location).map((chaser) => (
          <Marker
            key={chaser.id}
            position={[chaser.location!.latitude, chaser.location!.longitude]}
            icon={chaserIcon}
            eventHandlers={{
              click: () => onChaserClick(chaser),
            }}
          >
            <Popup>
              <div className="marker-popup">
                <h3>{chaser.name}</h3>
                <p className="callsign">{chaser.callsign}</p>
                {chaser.location?.speed && (
                  <p>Speed: {chaser.location.speed.toFixed(1)} mph</p>
                )}
                {chaser.location?.heading !== null && chaser.location?.heading !== undefined && (
                  <p>Heading: {chaser.location.heading}°</p>
                )}
                <button
                  className="btn-primary-small"
                  onClick={() => onChaserClick(chaser)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater chasers={chasers} />
      </MapContainer>

      <div className="active-chasers-panel">
        <h3>Active Chasers</h3>
        {chasers.length === 0 ? (
          <p className="empty-state">No active chasers</p>
        ) : (
          <div className="chasers-list-sidebar">
            {chasers.map((chaser) => (
              <div
                key={chaser.id}
                className={`chaser-item ${chaser.location ? 'has-location' : 'no-location'}`}
                onClick={() => chaser.location && onChaserClick(chaser)}
              >
                {chaser.avatar_url && (
                  <img src={chaser.avatar_url} alt={chaser.name} className="chaser-avatar-small" />
                )}
                <div className="chaser-details">
                  <h4>{chaser.name}</h4>
                  <p className="callsign">{chaser.callsign}</p>
                  {!chaser.location && <p className="status">No location data</p>}
                </div>
                {chaser.location && (
                  <div className="status-indicator active"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
