import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Ensure this points to your supabase client
import { signIn, signUp } from '../lib/auth';

interface AuthProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function Auth({ onSuccess, onClose }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 1. Sign up the user
        const { data: authData, error: authError } = await signUp(email, password);
        if (authError) throw authError;

        let avatarUrl = '';

        // 2. Upload avatar if selected
        if (avatar && authData.user) {
          const fileExt = avatar.name.split('.').pop();
          const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatar);

          if (uploadError) throw uploadError;
          avatarUrl = fileName;
        }

        // 3. Create the profile in the chasers table
        const { error: profileError } = await supabase
          .from('chasers')
          .insert([{ 
            id: authData.user?.id, 
            email, 
            bio, 
            avatar_url: avatarUrl 
          }]);

        if (profileError) throw profileError;
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {isSignUp && (
          <>
            <textarea
              placeholder="Tell us about your chasing bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
            <div className="file-input">
              <label>Profile Picture:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        <p onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </p>
      </form>
    </div>
  );
}