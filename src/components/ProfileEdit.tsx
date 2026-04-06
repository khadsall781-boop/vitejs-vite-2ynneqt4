import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function ProfileEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('chasers')
        .select('bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "Row not found" error if they don't have a profile yet
      
      if (data) {
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    
    setSaving(true);
    setMessage('');

    try {
      let updatedAvatarUrl = avatarUrl;

      // 1. Upload new image if one was selected
      if (newAvatar) {
        const fileExt = newAvatar.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, newAvatar);

        if (uploadError) throw uploadError;
        updatedAvatarUrl = fileName;
      }

      // 2. Update or Create the chasers table row
      const { error } = await supabase
        .from('chasers')
        .upsert({
          id: userId,
          bio,
          avatar_url: updatedAvatarUrl,
        });

      if (error) throw error;
      
      setMessage('Profile updated successfully!');
      
      if (newAvatar) {
         setAvatarUrl(updatedAvatarUrl);
         setNewAvatar(null);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
  if (!userId) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please sign in to edit your profile.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)', borderRadius: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Edit My Profile</h2>
      
      {message && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          background: message.startsWith('Error') ? '#3a1c1c' : '#1c3a21', 
          border: `1px solid ${message.startsWith('Error') ? 'var(--accent-red)' : 'var(--accent-green)'}`,
          borderRadius: '0.5rem'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Avatar Display & Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src={avatarUrl 
              ? `https://rbidtdkehdmzmmvpxjqh.supabase.co/storage/v1/object/public/avatars/${avatarUrl}`
              : 'https://via.placeholder.com/100?text=Photo'
            }
            alt="Profile"
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
          />
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Update Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewAvatar(e.target.files?.[0] || null)}
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Bio Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
           />
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}