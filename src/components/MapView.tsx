import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet'
import { Icon } from 'leaflet'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import 'leaflet/dist/leaflet.css'

type Chaser = Database['public']['Tables']['chasers']['Row']
type ChaserLocation = Database['public']['Tables']['chaser_locations']['Row']

interface ChaserWithLocation extends Chaser {
  location?: ChaserLocation
}

const chaserIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: true })
    }
  }, [center, map])
  return null
}

export function MapView({ onChaserClick }: { onChaserClick?: (chaser: Chaser) => void }) {
  const [chasers, setChasers] = useState<ChaserWithLocation[]>([])
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null)

  useEffect(() => {
    const fetchChasers = async () => {
      const { data } = await supabase
        .from('chasers')
        .select('*, chaser_locations(*)')
        .eq('is_active', true)
      
      if (data) {
        setChasers(data.map(c => ({ 
          ...c, 
          location: c.chaser_locations?.[0] 
        })))
      }
    }
    
    fetchChasers()
    
    const channel = supabase
      .channel('loc-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chaser_locations' 
      }, () => fetchChasers())
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={[34.7465, -92.2896]} 
        zoom={8} 
        maxZoom={18}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Map">
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          
          {/* Replaced RainViewer with IEM NEXRAD - No more zoom errors */}
          <LayersControl.Overlay checked name="Live Radar (NEXRAD)">
            <TileLayer 
              url="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png"
              opacity={0.5}
              attribution='&copy; IEM NEXRAD'
              zIndex={100}
            />
          </LayersControl.Overlay>
        </LayersControl>
        
        <MapController center={selectedPos} />

        {chasers.map((chaser) => (
          chaser.location && (
            <Marker 
              key={chaser.id} 
              position={[chaser.location.latitude, chaser.location.longitude]} 
              icon={chaserIcon}
              eventHandlers={{ 
                click: () => { 
                  setSelectedPos([chaser.location!.latitude, chaser.location!.longitude]); 
                  onChaserClick?.(chaser); 
                } 
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{chaser.name}</strong>
                  <p>{chaser.callsign || 'No Callsign'}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      <div className="active-chasers-panel">
        <h3>Live Chasers ({chasers.length})</h3>
        <div className="chasers-list-sidebar">
          {chasers.map(chaser => (
            <div 
              key={chaser.id} 
              className="chaser-item" 
              onClick={() => chaser.location && setSelectedPos([chaser.location.latitude, chaser.location.longitude])}
            >
              <span>{chaser.name}</span>
            </div>
          ))}
          {chasers.length === 0 && <p className="text-muted">No active chasers</p>}
        </div>
      </div>
    </div>
  )
}