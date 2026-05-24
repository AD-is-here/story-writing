import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import StoryCreator from './components/StoryCreator';
import StoryReader from './components/StoryReader';
import { BookOpen, BookMarked, User } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('shelf'); // 'shelf', 'create', 'reader'
  const [selectedStory, setSelectedStory] = useState(null);

  if (!supabase) {
    return (
      <div className="flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="card-parchment card-embossed" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center', border: '1px solid rgba(140, 115, 82, 0.35)' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-crimson)', marginBottom: '15px' }}>Missing Library Credentials</h2>
          <p className="font-story-vintage" style={{ marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--ink-medium)' }}>
            The scribal scrolls are currently sealed. The application could not detect your Supabase connection keys in the production environment.
          </p>
          <div style={{ background: 'var(--bg-parchment-dark)', border: '1px dashed rgba(78, 62, 46, 0.25)', padding: '16px 20px', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--ink-dark)' }}>
            <strong>How to resolve this in Vercel:</strong>
            <ol style={{ marginLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Go to your <strong>Vercel Dashboard</strong> and open your project.</li>
              <li>Navigate to <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</li>
              <li>Add the following keys exactly as written (make sure they start with <strong><code>VITE_</code></strong>):
                <ul style={{ marginLeft: '20px', marginTop: '5px', listStyleType: 'disc' }}>
                  <li><code>VITE_SUPABASE_URL</code></li>
                  <li><code>VITE_SUPABASE_ANON_KEY</code></li>
                </ul>
              </li>
              <li>Click <strong>Save</strong>.</li>
              <li>Go to <strong>Deployments</strong>, click the three dots on your latest deployment, and select <strong>Redeploy</strong> (or push a new commit) to apply the variables!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      // If logged out, reset view
      if (!session) {
        setCurrentView('shelf');
        setSelectedStory(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleStoryCreated = (story) => {
    setSelectedStory(story);
    setCurrentView('reader');
  };

  const handleSelectStory = (story) => {
    setSelectedStory(story);
    setCurrentView('reader');
  };

  const handleDeleteStorySuccess = () => {
    setCurrentView('shelf');
    setSelectedStory(null);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'var(--gold-dark)', animation: 'spin 2s linear infinite' }}>
          <BookMarked size={48} />
        </div>
        <p className="font-serif-vintage" style={{ fontStyle: 'italic', color: 'var(--ink-light)', fontSize: '1.1rem' }}>
          Opening the archives...
        </p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Banner - Whimsical Header */}
      <header 
        style={{ 
          background: 'var(--ink-dark)', 
          color: 'var(--bg-parchment-light)',
          borderBottom: '3px double var(--gold)',
          padding: '15px 30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          zIndex: 10
        }}
      >
        <div 
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          {/* Logo Brand */}
          <div 
            onClick={() => { if (session) setCurrentView('shelf'); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: session ? 'pointer' : 'default' 
            }}
          >
            <span style={{ color: 'var(--gold)' }}><BookOpen size={24} /></span>
            <span 
              className="font-serif-vintage" 
              style={{ 
                fontWeight: '900', 
                fontSize: '1.2rem', 
                letterSpacing: '0.1em',
                color: 'var(--gold-light)'
              }}
            >
              SCRIBE'S SANCTUARY
            </span>
          </div>

          {/* Whimsical subtitle / status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="font-serif-vintage" 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--gold)', 
                fontStyle: 'italic', 
                letterSpacing: '0.05em' 
              }}
            >
              AI SCRIPTORIUM & FOLIO JOURNAL
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: '1', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '30px 20px' }}>
        {!session ? (
          <Auth onAuthSuccess={(sess) => setSession(sess)} />
        ) : (
          <>
            {currentView === 'shelf' && (
              <Dashboard 
                session={session} 
                onSelectStory={handleSelectStory}
                onCreateNew={() => setCurrentView('create')}
                onLogout={handleLogout}
              />
            )}

            {currentView === 'create' && (
              <StoryCreator 
                session={session}
                onStoryCreated={handleStoryCreated}
                onCancel={() => setCurrentView('shelf')}
              />
            )}

            {currentView === 'reader' && (
              <StoryReader 
                story={selectedStory}
                onBack={() => setCurrentView('shelf')}
                onDeleteSuccess={handleDeleteStorySuccess}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer 
        style={{ 
          background: 'var(--ink-dark)', 
          color: 'var(--ink-muted)', 
          textAlign: 'center', 
          padding: '20px', 
          fontSize: '0.75rem', 
          borderTop: '1px solid rgba(189, 162, 126, 0.2)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.05em'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span>© 2026 Scribe's Sanctuary. All Scrolls Encrypted.</span>
          <span>Weaved with Supabase & Google Gemini AI</span>
        </div>
      </footer>

    </div>
  );
}
