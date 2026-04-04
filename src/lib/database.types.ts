export interface Database {
  public: {
    Tables: {
      chasers: {
        Row: {
          id: string
          name: string
          callsign: string
          stream_url: string | null
          avatar_url: string | null
          is_active: boolean
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          callsign: string
          stream_url?: string | null
          avatar_url?: string | null
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          callsign?: string
          stream_url?: string | null
          avatar_url?: string | null
          is_active?: boolean
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chaser_locations: {
        Row: {
          id: string
          chaser_id: string
          latitude: number
          longitude: number
          heading: number | null
          speed: number | null
          altitude: number | null
          accuracy: number | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          chaser_id: string
          latitude: number
          longitude: number
          heading?: number | null
          speed?: number | null
          altitude?: number | null
          accuracy?: number | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          chaser_id?: string
          latitude?: number
          longitude?: number
          heading?: number | null
          speed?: number | null
          altitude?: number | null
          accuracy?: number | null
          timestamp?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'chaser' | 'viewer' | 'moderator'
          chaser_id: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: 'chaser' | 'viewer' | 'moderator'
          chaser_id?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'chaser' | 'viewer' | 'moderator'
          chaser_id?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
    }
  }
}
