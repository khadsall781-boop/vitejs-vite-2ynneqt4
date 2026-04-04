import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Chaser = Database['public']['Tables']['chasers']['Row']
type ChaserInsert = Database['public']['Tables']['chasers']['Insert']

interface ChaserManagementProps {
  onClose: () => void
}

export function ChaserManagement({ onClose }: ChaserManagementProps) {
  const [chasers, setChasers] = useState<Chaser[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    callsign: '',
    stream_url: '',
    avatar_url: '',
  })

  useEffect(() => {
    loadChasers()
  }, [])

  async function loadChasers() {
    const { data, error } = await supabase
      .from('chasers')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading chasers:', error)
      return
    }

    setChasers(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const insertData: ChaserInsert = {
      name: formData.name,
      callsign: formData.callsign,
      stream_url: formData.stream_url || null,
      avatar_url: formData.avatar_url || null,
    }

    const { error } = await supabase
      .from('chasers')
      .insert(insertData as any)

    if (error) {
      console.error('Error adding chaser:', error)
      alert('Error adding chaser: ' + error.message)
      return
    }

    setFormData({ name: '', callsign: '', stream_url: '', avatar_url: '' })
    setIsAdding(false)
    loadChasers()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this chaser?')) return

    const { error } = await supabase
      .from('chasers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting chaser:', error)
      return
    }

    loadChasers()
  }

  async function toggleActive(chaser: Chaser) {
    const result: any = await (supabase as any)
      .from('chasers')
      .update({ is_active: !chaser.is_active })
      .eq('id', chaser.id)

    if (result.error) {
      console.error('Error updating chaser:', result.error)
      return
    }

    loadChasers()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Chasers</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!isAdding && (
            <button className="btn-primary" onClick={() => setIsAdding(true)}>
              + Add New Chaser
            </button>
          )}

          {isAdding && (
            <form onSubmit={handleSubmit} className="chaser-form">
              <h3>Add New Chaser</h3>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Callsign (unique identifier)"
                value={formData.callsign}
                onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                required
              />
              <input
                type="url"
                placeholder="Stream URL (optional)"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="Avatar URL (optional)"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
              <div className="form-actions">
                <button type="submit" className="btn-primary">Add Chaser</button>
                <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="chasers-list">
            <h3>Current Chasers</h3>
            {chasers.length === 0 ? (
              <p className="empty-state">No chasers added yet</p>
            ) : (
              <div className="chasers-grid">
                {chasers.map((chaser) => (
                  <div key={chaser.id} className="chaser-card">
                    <div className="chaser-info">
                      {chaser.avatar_url && (
                        <img src={chaser.avatar_url} alt={chaser.name} className="chaser-avatar" />
                      )}
                      <div>
                        <h4>{chaser.name}</h4>
                        <p className="callsign">{chaser.callsign}</p>
                        <label className="active-toggle">
                          <input
                            type="checkbox"
                            checked={chaser.is_active}
                            onChange={() => toggleActive(chaser)}
                          />
                          <span>Active</span>
                        </label>
                      </div>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(chaser.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
