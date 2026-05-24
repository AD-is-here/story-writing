import React, { useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, BookOpen, Quote, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const READ_THEMES = {
  parchment: { bg: '#f4ede4', paper: '#fbfbf7', ink: '#2a2015', label: 'Vintage' },
  antique: { bg: '#eae0d5', paper: '#f4ecd8', ink: '#322417', label: 'Antique' },
  charcoal: { bg: '#2b2621', paper: '#36302a', ink: '#f3e8dc', label: 'Ink Dark' }
};

export default function StoryReader({ story, onBack, onDeleteSuccess }) {
  const [fontSize, setFontSize] = useState(1.05); // rem
  const [themeName, setThemeName] = useState('parchment');
  const [deleting, setDeleting] = useState(false);

  const currentTheme = READ_THEMES[themeName];

  // Helper to split story content into paragraphs for clean typography
  const paragraphs = story.content.split('\n\n').filter(p => p.trim() !== '');

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to burn this story scroll? It will be deleted forever.")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id);

      if (error) throw error;
      onDeleteSuccess(story.id);
    } catch (err) {
      alert("Failed to delete scroll: " + err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0 40px' }}>
      
      {/* Reader Controls Toolbar */}
      <div 
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          padding: '10px 20px',
          background: 'rgba(78, 62, 46, 0.05)',
          borderBottom: '1px solid rgba(78, 62, 46, 0.1)',
          borderRadius: '4px'
        }}
      >
        <button 
          className="btn-vintage-secondary"
          onClick={onBack}
          style={{ padding: '8px 16px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Library</span>
        </button>

        {/* Text Scaling & Theme Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Font Sizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', fontWeight: '700', color: 'var(--ink-light)' }}>
              Font Size:
            </span>
            <button 
              onClick={() => setFontSize(prev => Math.max(0.85, prev - 0.1))} 
              style={{ background: 'none', border: '1px solid var(--ink-muted)', borderRadius: '3px', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--ink-dark)' }}
              title="Decrease Font Size"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(1.4, prev + 0.1))}
              style={{ background: 'none', border: '1px solid var(--ink-muted)', borderRadius: '3px', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--ink-dark)' }}
              title="Increase Font Size"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Theme Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', fontWeight: '700', color: 'var(--ink-light)', marginRight: '4px' }}>
              Paper:
            </span>
            {Object.entries(READ_THEMES).map(([name, config]) => (
              <button
                key={name}
                onClick={() => setThemeName(name)}
                style={{
                  background: config.paper,
                  color: config.ink,
                  border: themeName === name ? '2px solid var(--gold-dark)' : '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: themeName === name ? '0 0 5px rgba(189, 162, 126, 0.5)' : 'none'
                }}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Burn scroll (delete) */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-crimson)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: '700',
              fontFamily: 'Cinzel, serif',
              marginLeft: '10px'
            }}
          >
            <Trash2 size={16} />
            <span>{deleting ? "Burning..." : "Burn Scroll"}</span>
          </button>

        </div>
      </div>

      {/* Book Outer Wrapper */}
      <div 
        style={{
          background: currentTheme.bg,
          padding: '30px 15px',
          borderRadius: '12px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
          maxWidth: '960px',
          margin: '0 auto',
          border: '1px solid rgba(78, 62, 46, 0.12)',
          transition: 'all 0.4s ease'
        }}
      >
        {/* Book Spine / Cover inner */}
        <div 
          className="card-parchment" 
          style={{
            background: currentTheme.paper,
            color: currentTheme.ink,
            border: '1px solid rgba(78, 62, 46, 0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            padding: '40px',
            position: 'relative',
            borderRadius: '6px',
            overflow: 'hidden'
          }}
        >
          {/* Subtle paper grain in book reader */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: themeName === 'charcoal' ? 0.03 : 0.07,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            pointerEvents: 'none'
          }} />

          {/* Leather spine down the middle for desktop two-page look */}
          <div className="book-spine-divider" style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: '2px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(255,255,255,0.05), rgba(0,0,0,0.15))',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            display: 'block'
          }} />

          {/* Book Content - Split columns on large screens to mimic pages */}
          <div className="book-pages" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '60px',
            position: 'relative',
            zIndex: 1
          }}>
            
            {/* Page 1: Title, Cover & Introduction */}
            <div style={{ paddingRight: '10px' }}>
              
              {/* Keywords Tag Banner */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap', 
                marginBottom: '25px',
                borderBottom: '1px dashed rgba(78, 62, 46, 0.15)',
                paddingBottom: '12px'
              }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', fontWeight: '700', opacity: 0.7 }}>
                  Keywords:
                </span>
                {story.keywords.map((word, idx) => (
                  <span 
                    key={idx}
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'Lora, serif',
                      fontStyle: 'italic',
                      background: 'rgba(189, 162, 126, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      border: '1px solid rgba(189, 162, 126, 0.25)',
                      color: currentTheme.ink
                    }}
                  >
                    #{word}
                  </span>
                ))}
              </div>

              {/* Title Section */}
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ 
                  fontSize: '2rem', 
                  color: currentTheme.ink, 
                  lineHeight: '1.2', 
                  marginBottom: '10px' 
                }}>
                  {story.title}
                </h1>
                <div style={{ 
                  width: '60px', 
                  height: '2px', 
                  background: 'var(--gold-dark)', 
                  margin: '15px 0' 
                }} />
                <p style={{ 
                  fontSize: '0.8rem', 
                  fontFamily: 'Cinzel, serif', 
                  opacity: 0.7, 
                  letterSpacing: '0.05em' 
                }}>
                  Inscribed: {new Date(story.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* First half of paragraphs */}
              <div style={{ 
                fontSize: `${fontSize}rem`, 
                lineHeight: '1.75', 
                textAlign: 'justify' 
              }}>
                {paragraphs.slice(0, Math.ceil(paragraphs.length / 2)).map((p, idx) => (
                  <p key={idx} style={{ marginBottom: '20px', textIndent: idx > 0 ? '20px' : '0', color: currentTheme.ink }}>
                    {idx === 0 ? (
                      // Dropcap for first paragraph
                      <span>
                        <span style={{ 
                          float: 'left', 
                          fontSize: '3.5rem', 
                          lineHeight: '0.8', 
                          paddingTop: '4px',
                          paddingRight: '8px', 
                          fontFamily: 'Cinzel, serif', 
                          fontWeight: '700',
                          color: 'var(--gold-dark)'
                        }}>
                          {p.charAt(0)}
                        </span>
                        {p.slice(1)}
                      </span>
                    ) : p}
                  </p>
                ))}
              </div>

            </div>

            {/* Page 2: Story conclusion & Moral Plaque */}
            <div style={{ paddingLeft: '10px' }}>
              
              {/* Second half of paragraphs */}
              <div style={{ 
                fontSize: `${fontSize}rem`, 
                lineHeight: '1.75', 
                textAlign: 'justify',
                marginBottom: '35px'
              }}>
                {paragraphs.slice(Math.ceil(paragraphs.length / 2)).map((p, idx) => (
                  <p key={idx} style={{ marginBottom: '20px', textIndent: '20px', color: currentTheme.ink }}>
                    {p}
                  </p>
                ))}
              </div>

              {/* Gold Embossed Moral Plaque */}
              <div 
                className="card-parchment card-embossed animate-fade-in"
                style={{
                  background: 'var(--bg-parchment-light)',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 8px 20px rgba(140, 115, 82, 0.15)',
                  padding: '25px',
                  borderRadius: '6px',
                  marginTop: '20px',
                  position: 'relative'
                }}
              >
                <div className="flex-center" style={{ 
                  position: 'absolute', 
                  top: '-15px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: 'var(--ink-dark)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)',
                  borderRadius: '20px',
                  padding: '2px 16px',
                  fontSize: '0.75rem',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: '700',
                  letterSpacing: '0.08em'
                }}>
                  The Moral
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ color: 'var(--gold-dark)', display: 'block', marginBottom: '8px' }}>
                    <Quote size={24} style={{ opacity: 0.5 }} />
                  </span>
                  <p style={{ 
                    fontFamily: 'Lora, serif',
                    fontStyle: 'italic',
                    fontSize: `${fontSize * 0.95}rem`,
                    fontWeight: '600',
                    lineHeight: '1.5',
                    color: 'var(--ink-dark)'
                  }}>
                    {story.moral}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Book Footer / Page Numbers */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '40px', 
            borderTop: '1px solid rgba(78, 62, 46, 0.12)', 
            paddingTop: '20px',
            fontSize: '0.75rem',
            fontFamily: 'Cinzel, serif',
            fontWeight: '700',
            opacity: 0.6,
            color: currentTheme.ink
          }}>
            <span>Page I</span>
            <span style={{ transform: 'translateX(-50%)' }}><BookOpen size={14} /></span>
            <span>Page II</span>
          </div>

        </div>
      </div>
      
      {/* CSS responsive styling overlay to turn 2-column layout to single column on mobile */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .book-pages {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .book-spine-divider {
            display: none !important;
          }
        }
      `}} />

    </div>
  );
}
