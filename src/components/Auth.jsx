import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, User, Lock, Feather, Book } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    if (username.trim().includes('@')) {
      setErrorMsg('Username should not contain the "@" symbol.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Map username to a safe, valid email behind the scenes
    const email = `${username.trim().toLowerCase()}@storyapp.com`;

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        setSuccessMsg('Your library bookplate has been registered! You may now sign in.');
        setIsSignUp(false);
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '85vh', padding: '20px' }}>
      <div 
        className="card-parchment card-embossed" 
        style={{ 
          maxWidth: '450px', 
          width: '100%', 
          padding: '40px',
          boxShadow: '0 15px 40px rgba(42, 32, 21, 0.25)',
          border: '1px solid rgba(140, 115, 82, 0.3)'
        }}
      >
        {/* Bookplate Header Design */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="flex-center" style={{ marginBottom: '12px' }}>
            <div 
              className="flex-center" 
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'var(--ink-dark)', 
                color: 'var(--gold)',
                border: '2px solid var(--gold)'
              }}
            >
              <Book size={28} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--ink-dark)', marginBottom: '4px' }}>
            {isSignUp ? 'Ex Libris' : 'Library Login'}
          </h2>
          <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ink-light)' }}>
            {isSignUp ? 'Create your personal reading log' : 'Open your personal collection'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Username Input */}
          <div>
            <label 
              style={{ 
                fontFamily: 'Cinzel, serif', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                letterSpacing: '0.05em',
                marginBottom: '8px', 
                display: 'block',
                color: 'var(--ink-medium)'
              }}
            >
              Librarian Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }}>
                <User size={18} />
              </span>
              <input 
                type="text" 
                className="input-desk" 
                placeholder="e.g. ankit_scribe" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label 
              style={{ 
                fontFamily: 'Cinzel, serif', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                letterSpacing: '0.05em',
                marginBottom: '8px', 
                display: 'block',
                color: 'var(--ink-medium)'
              }}
            >
              Secret Keyphrase
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }}>
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                className="input-desk" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Alert Callouts */}
          {errorMsg && (
            <div 
              style={{ 
                padding: '12px 16px', 
                background: 'rgba(92, 29, 36, 0.08)', 
                borderLeft: '4px solid var(--accent-crimson)',
                borderRadius: '4px',
                color: 'var(--accent-crimson)',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}
            >
              <strong>Correction:</strong> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div 
              style={{ 
                padding: '12px 16px', 
                background: 'rgba(28, 61, 39, 0.08)', 
                borderLeft: '4px solid var(--accent-forest)',
                borderRadius: '4px',
                color: 'var(--accent-forest)',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}
            >
              <strong>Noted:</strong> {successMsg}
            </div>
          )}

          {/* Action Button */}
          <button 
            type="submit" 
            className="btn-vintage flex-center" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Dipping Ink...</span>
            ) : (
              <>
                <Feather size={18} />
                <span>{isSignUp ? 'Inscribe Plate' : 'Enter Study'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px dashed rgba(78, 62, 46, 0.2)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>
            {isSignUp ? 'Already own a bookplate?' : 'Seeking a new bookplate?'}
          </p>
          <button 
            type="button" 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--ink-dark)', 
              fontWeight: '700', 
              fontFamily: 'Cinzel, serif',
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textDecoration: 'underline', 
              cursor: 'pointer',
              marginTop: '4px' 
            }}
            disabled={loading}
          >
            {isSignUp ? 'Sign In Instead' : 'Register New Username'}
          </button>
        </div>
      </div>
    </div>
  );
}
