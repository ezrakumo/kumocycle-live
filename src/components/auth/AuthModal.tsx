import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signup' | 'login';
  onModeChange: (newMode: 'signup' | 'login') => void;
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let result;
      if (mode === 'signup') {
        result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { error } = result;
      if (error) throw error;

      setMessage({ 
        text: mode === 'signup' ? 'Account created successfully!' : 'Logged in successfully!', 
        type: 'success' 
      });
      
      // Optional: Auto-close after success
      setTimeout(() => { 
        onClose(); 
        resetForm(); 
      }, 2000);

    } catch (err: any) {
      setMessage({ text: err.message || `${mode === 'signup' ? 'Signup' : 'Login'} failed.`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setFullName(''); setMessage(null);
  };

    return (
    /* OVERLAY CONTAINER - PURE INLINE STYLES */
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark background
        backdropFilter: 'blur(4px)',           // Blur effect
        display: 'flex',
        alignItems: 'center',                  // Vertical center
        justifyContent: 'center',              // Horizontal center
        zIndex: 9999,                          // Above everything
        padding: '1rem'                        // Margin on mobile
      }}
    >
      
      {/* MODAL BOX */}
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '448px', // Max width constraint
          overflow: 'hidden',
          transform: 'scale(1)'
        }}
      >
        
        {/* HEADER GRADIENT */}
        <div 
          style={{
            background: 'linear-gradient(to right, #0056B3, #28A745)',
            padding: '24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose} 
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
          
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {mode === 'signup' ? 'Join KumoCycle' : 'Welcome Back'}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            {mode === 'signup' ? 'Start recycling, earning, and fixing today.' : 'Log in to manage your points and bookings.'}
          </p>
        </div>
        
        {/* FORM BODY */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {message && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'medium',
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'semibold', color: '#374151' }}>Full Name</label>
              <input 
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} 
                placeholder="Chinedu Okafor" 
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'semibold', color: '#374151' }}>Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '16px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'semibold', color: '#374151' }}>Password</label>
            <input 
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '16px'
              }}
            />
          </div>

          <button 
            type="submit" disabled={loading} 
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              backgroundColor: '#0056B3',
              color: '#ffffff',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontSize: '16px'
            }}
          >
            {loading ? 'Processing...' : (mode === 'signup' ? 'Sign Up Free' : 'Log In')}
          </button>

          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            <button 
              type="button" onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')} 
              style={{
                background: 'none',
                border: 'none',
                color: '#0056B3',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {mode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}