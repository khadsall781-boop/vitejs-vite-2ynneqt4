import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Chaser = Database['public']['Tables']['chasers']['Row']

export function ChaserManagement() {
  const [chasers, setChasers] = useState<Chaser[]>([])
  const [name, setName] = useState('')
  const [callsign, setCallsign] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchChasers()
  }, [])

  const fetchChasers = async () => {
    const { data } = await supabase
      .from('chasers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setChasers(data)
  }

  const handleAddChaser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: newChaser, error: chaserError } = await supabase
        .from('chasers')
        .insert([{ name, callsign, is_active: true }])
        .select()
        .single()

      if (chaserError) throw chaserError

      // Initialize with default location (North Little Rock area)
      await supabase.from('chaser_locations').insert([{
        chaser_id: newChaser.id,
        latitude: 34.7465,
        longitude: -92.2896,
        timestamp: new Date().toISOString()
      }])

      setName('')
      setCallsign('')
      fetchChasers()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('chasers')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    
    if (error) alert(error.message)
    else fetchChasers()
  }

  const deleteChaser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chaser? This will remove all location history.')) return

    const { error } = await supabase
      .from('chasers')
      .delete()
      .eq('id', id)

    if (error) alert(error.message)
    else fetchChasers()
  }

  return (
    <div className="management-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>
          👤 Register New Chaser
        </h2>
        
        <form onSubmit={handleAddChaser} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <input 
            className="btn-outline"
            style={{ flex: '1', minWidth: '200px', padding: '0.75rem', background: 'var(--bg-dark)', color: 'white' }}
            placeholder="Chaser Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <input 
            className="btn-outline"
            style={{ flex: '1', minWidth: '200px', padding: '0.75rem', background: 'var(--bg-dark)', color: 'white' }}
            placeholder="Callsign" 
            value={callsign} 
            onChange={(e) => setCallsign(e.target.value)} 
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Processing...' : "Add to Tornado Tacklers' Map"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Active Roster</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {chasers.map(chaser => (
            <div 
              key={chaser.id} 
              className="chaser-item" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${chaser.is_active ? 'var(--accent-blue)' : 'var(--border-color)'}`
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={chaser.avatar_url 
                    ? `https://rbidtdkehdmzmmvpxjqh.supabase.co/storage/v1/object/public/avatars/${chaser.avatar_url}`
                    : 'https://via.placeholder.com/60?text=?'
                  } 
                  alt={chaser.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    backgroundColor: 'var(--border-color)'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{chaser.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {chaser.callsign || 'No Callsign'}
                  </div>
                  {chaser.bio && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {chaser.bio}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={chaser.is_active ? "btn-outline" : "btn-primary"}
                  onClick={() => toggleStatus(chaser.id, chaser.is_active)}
                >
                  {chaser.is_active ? 'Set Inactive' : 'Set Active'}
                </button>
                <button 
                  className="btn-outline" 
                  style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                  onClick={() => deleteChaser(chaser.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}