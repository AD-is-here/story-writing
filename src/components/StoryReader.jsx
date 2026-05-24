import React, { useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, BookOpen, Quote, Trash2, Highlighter, RotateCcw } from 'lucide-react';
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

  // Highlighter State
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [highlightKey, setHighlightKey] = useState(0); // Trigger re-render to clear manual DOM wraps

  const currentTheme = READ_THEMES[themeName];
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

  // Selection Highlighter Logic
  const handleMouseUp = () => {
    if (!highlighterActive) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    try {
      const range = selection.getRangeAt(0);
      const storyContainer = document.getElementById('story-content-container');
      
      // Ensure the selection lies entirely inside the story content container
      if (storyContainer && storyContainer.contains(range.commonAncestorContainer)) {
        const mark = document.createElement('mark');
        mark.className = 'marker-highlight';
        
        // Wrap the selected range in our highlighted marker element
        range.surroundContents(mark);
        
        // Clear browser default highlight after selection
        selection.removeAllRanges();
      }
    } catch (err) {
      console.warn("Selection crossed block boundaries, falling back to native styled selection.", err);
    }
  };

  // Clear all highlights by forcing a re-render and wiping inline DOM wraps
  const handleClearHighlights = () => {
    setHighlightKey(prev => prev + 1);
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
          padding: '12px 20px',
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

        {/* Text Scaling, Highlighter & Theme Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          
          {/* Highlighter Pen Toggle */}
          <button
            onClick={() => setHighlighterActive(!highlighterActive)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: highlighterActive ? 'var(--gold-glow)' : 'transparent',
              border: highlighterActive ? '1px solid var(--gold-dark)' : '1px solid var(--ink-muted)',
              borderRadius: '3px',
              cursor: 'pointer',
              color: 'var(--ink-dark)',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.75rem',
              fontWeight: '700',
              boxShadow: highlighterActive ? '0 0 8px rgba(189, 162, 126, 0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}
            title="Toggle Highlighter Pen (Drag select text to draw highlights!)"
          >
            <Highlighter size={16} style={{ color: highlighterActive ? '#b39262' : 'inherit' }} />
            <span>{highlighterActive ? "Pen: Active" : "Highlighter"}</span>
          </button>

          {/* Reset highlights */}
          {highlighterActive && (
            <button
              onClick={handleClearHighlights}
              style={{
                background: 'none',
                border: '1px solid var(--ink-muted)',
                borderRadius: '3px',
                padding: '6px 10px',
                cursor: 'pointer',
                color: 'var(--ink-medium)',
                fontSize: '0.75rem',
                fontFamily: 'Cinzel, serif',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          )}

          {/* Font Sizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              fontFamily: 'Cinzel, serif',
            }}
          >
            <Trash2 size={15} />
            <span>Burn</span>
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
          border: '1px solid rgba(78, 62, 46, 0.12)'
        }}
      >
        {/* Book Container with 3D spine and custom highlighter cursor */}
        <div 
          className="card-parchment" 
          key={highlightKey}
          onMouseUp={handleMouseUp}
          style={{
            background: currentTheme.paper,
            color: currentTheme.ink,
            border: '1px solid rgba(78, 62, 46, 0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            padding: '40px',
            position: 'relative',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: highlighterActive ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'%23FFE082\' stroke=\'%23B39262\' stroke-width=\'1.5\'><path d=\'M18.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z\'/></svg>") 2 18, text' : 'text'
          }}
        >
          {/* Subtle paper grain texture */}
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

          {/* Book Spine Down The Middle */}
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

          {/* Side-by-Side Double Page Layout */}
          <div id="story-content-container" className="book-pages" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '60px',
            position: 'relative',
            zIndex: 1
          }}>
            
            {/* Page I: Cover hashtags, Title and First Half of Story */}
            <div style={{ paddingRight: '10px' }}>
              
              {/* Keywords Tag Banner */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap', 
                marginBottom: '25px',
                borderBottom: '1px dashed rgba(78, 62, 46, 0.15)',
                paddingBottom: '12px',
                userSelect: 'none'
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
              <div style={{ marginBottom: '30px', userSelect: 'none' }}>
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
                          color: 'var(--gold-dark)',
                          userSelect: 'none'
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

            {/* Page II: Second Half of Story and Moral Plaque */}
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
                className="card-parchment card-embossed"
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
                  letterSpacing: '0.08em',
                  userSelect: 'none'
                }}>
                  The Moral
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ color: 'var(--gold-dark)', display: 'block', marginBottom: '8px', userSelect: 'none' }}>
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
            color: currentTheme.ink,
            userSelect: 'none'
          }}>
            <span>Page I</span>
            <span style={{ transform: 'translateX(-50%)' }}><BookOpen size={14} /></span>
            <span>Page II</span>
          </div>

        </div>
      </div>
      
      {/* Styles for customizable selection and persistent highlights */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Custom highlight color when Pen Mode is ON */
        .highlighter-active ::selection {
          background: rgba(255, 235, 59, 0.6) !important;
          color: inherit !important;
        }
        
        .highlighter-active ::-moz-selection {
          background: rgba(255, 235, 59, 0.6) !important;
          color: inherit !important;
        }

        /* Persistent highlight element */
        .marker-highlight {
          background: linear-gradient(104deg, rgba(255, 235, 59, 0.45) 0%, rgba(255, 235, 59, 0.55) 100%) !important;
          box-shadow: inset 0 -2px 0 rgba(255, 223, 0, 0.3);
          border-radius: 2px;
          padding: 0 2px;
          display: inline;
        }

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
