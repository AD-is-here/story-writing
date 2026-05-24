import React, { useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, BookOpen, Quote, Trash2, Highlighter, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const [highlightedParagraphs, setHighlightedParagraphs] = useState({});

  // Book Page Navigation State
  // We structure the book into 3 spreads:
  // Spread 0: [Front Cover, Page 1 (Intro)]
  // Spread 1: [Page 2, Page 3]
  // Spread 2: [Page 4 (Conclusion), Back Cover (Moral Plaque)]
  const [currentSpread, setCurrentSpread] = useState(0);
  const [flipDirection, setFlipDirection] = useState(''); // 'next' or 'prev'
  const [isFlipping, setIsFlipping] = useState(false);

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

  // Toggle Highlight
  const handleParagraphClick = (idx) => {
    if (!highlighterActive) return;
    setHighlightedParagraphs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Page Turn Animation trigger
  const handleSpreadChange = (newSpread, direction) => {
    if (isFlipping || newSpread < 0 || newSpread > 2) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    
    // Switch pages midway through the 3D flip animation for maximum realism!
    setTimeout(() => {
      setCurrentSpread(newSpread);
    }, 300);

    setTimeout(() => {
      setIsFlipping(false);
      setFlipDirection('');
    }, 600);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '10px 0 40px' }}>
      
      {/* Reader Controls Toolbar */}
      <div 
        style={{ 
          maxWidth: '960px', 
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
            title="Toggle Highlighter Pen"
          >
            <Highlighter size={16} style={{ color: highlighterActive ? '#b39262' : 'inherit' }} />
            <span>{highlighterActive ? "Highlighter ON" : "Highlighter Pen"}</span>
          </button>

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
          boxShadow: '0 25px 50px rgba(0,0,0,0.18)',
          maxWidth: '960px',
          margin: '0 auto',
          border: '1px solid rgba(78, 62, 46, 0.12)',
          position: 'relative'
        }}
      >
        {/* Navigation Arrow Left */}
        {currentSpread > 0 && (
          <button
            onClick={() => handleSpreadChange(currentSpread - 1, 'prev')}
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'var(--ink-dark)',
              color: 'var(--bg-parchment-light)',
              border: '2px solid var(--gold)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {currentSpread < 2 && (
          <button
            onClick={() => handleSpreadChange(currentSpread + 1, 'next')}
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'var(--ink-dark)',
              color: 'var(--bg-parchment-light)',
              border: '2px solid var(--gold)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Book Container with 3D perspective */}
        <div 
          className={`book-container ${isFlipping ? `flipping-${flipDirection}` : ''}`}
          style={{
            background: currentTheme.paper,
            color: currentTheme.ink,
            border: '1px solid rgba(78, 62, 46, 0.15)',
            boxShadow: '0 10px 35px rgba(0,0,0,0.1)',
            padding: '40px',
            position: 'relative',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: highlighterActive ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'%23FFE082\' stroke=\'%23B39262\' stroke-width=\'1.5\'><path d=\'M18.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z\'/></svg>") 2 18, auto' : 'default'
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
            display: 'block',
            zIndex: 5
          }} />

          {/* SPREAD VIEWER */}
          <div className="book-pages" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '60px',
            position: 'relative',
            zIndex: 1
          }}>
            
            {/* ==================== SPREAD 0 ==================== */}
            {currentSpread === 0 && (
              <>
                {/* Left Page: Embossed Leather Cover plate */}
                <div style={{ 
                  backgroundColor: story.cover_color || '#5c1d24', 
                  borderRadius: '6px', 
                  padding: '40px 20px', 
                  color: 'var(--gold-light)',
                  border: '3px double var(--gold)',
                  boxShadow: 'inset 0 0 25px rgba(0,0,0,0.5)',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', letterSpacing: '0.15em', opacity: 0.8 }}>
                    EX LIBRIS SCRIBE JOURNAL
                  </div>

                  <div style={{ padding: '20px 0' }}>
                    <h1 style={{ 
                      fontFamily: 'Cinzel, serif', 
                      fontSize: '1.9rem', 
                      lineHeight: '1.3', 
                      color: 'var(--gold-light)', 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                      fontWeight: '800'
                    }}>
                      {story.title}
                    </h1>
                    <div style={{ width: '40px', height: '2px', background: 'var(--gold)', margin: '15px auto' }} />
                    <p style={{ fontFamily: 'Lora, serif', fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.9 }}>
                      Weaved by the ink of Google Gemini
                    </p>
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      fontFamily: 'Cinzel, serif', 
                      borderTop: '1px solid rgba(237,216,191,0.2)', 
                      paddingTop: '12px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '5px',
                      justifyContent: 'center'
                    }}>
                      {story.keywords.map((w, i) => (
                        <span key={i} style={{ opacity: 0.85 }}>#{w}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Page: Introduction */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(78,62,46,0.15)', paddingBottom: '8px', marginBottom: '20px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.7 }}>
                      <span>VOLUME I</span>
                      <span>CHAPTER I</span>
                    </div>

                    <div style={{ fontSize: `${fontSize}rem`, textAlign: 'justify' }}>
                      {paragraphs.slice(0, 1).map((p, idx) => (
                        <p 
                          key={idx} 
                          onClick={() => handleParagraphClick(0)}
                          className={highlightedParagraphs[0] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {/* Dropcap for starting */}
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
                        </p>
                      ))}

                      {paragraphs.slice(1, 2).map((p, idx) => (
                        <p 
                          key={idx} 
                          onClick={() => handleParagraphClick(1)}
                          className={highlightedParagraphs[1] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Page number */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(78,62,46,0.12)', paddingTop: '10px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.6 }}>
                    <span>Page 1</span>
                  </div>
                </div>
              </>
            )}

            {/* ==================== SPREAD 1 ==================== */}
            {currentSpread === 1 && (
              <>
                {/* Left Page: Story Continuation */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(78,62,46,0.15)', paddingBottom: '8px', marginBottom: '20px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.7 }}>
                      <span>VOLUME I</span>
                      <span>CHAPTER II</span>
                    </div>

                    <div style={{ fontSize: `${fontSize}rem`, textAlign: 'justify' }}>
                      {paragraphs.slice(2, 3).map((p, idx) => (
                        <p 
                          key={idx}
                          onClick={() => handleParagraphClick(2)}
                          className={highlightedParagraphs[2] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {p}
                        </p>
                      ))}

                      {paragraphs.slice(3, 4).map((p, idx) => (
                        <p 
                          key={idx}
                          onClick={() => handleParagraphClick(3)}
                          className={highlightedParagraphs[3] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid rgba(78,62,46,0.12)', paddingTop: '10px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.6 }}>
                    <span>Page 2</span>
                  </div>
                </div>

                {/* Right Page: Story Continuation */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(78,62,46,0.15)', paddingBottom: '8px', marginBottom: '20px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.7 }}>
                      <span>VOLUME I</span>
                      <span>CHAPTER III</span>
                    </div>

                    <div style={{ fontSize: `${fontSize}rem`, textAlign: 'justify' }}>
                      {paragraphs.slice(4, 5).map((p, idx) => (
                        <p 
                          key={idx}
                          onClick={() => handleParagraphClick(4)}
                          className={highlightedParagraphs[4] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {p}
                        </p>
                      ))}

                      {paragraphs.slice(5, 6).map((p, idx) => (
                        <p 
                          key={idx}
                          onClick={() => handleParagraphClick(5)}
                          className={highlightedParagraphs[5] ? 'marker-highlight' : ''}
                          style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(78,62,46,0.12)', paddingTop: '10px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.6 }}>
                    <span>Page 3</span>
                  </div>
                </div>
              </>
            )}

            {/* ==================== SPREAD 2 ==================== */}
            {currentSpread === 2 && (
              <>
                {/* Left Page: Final Paragraphs */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(78,62,46,0.15)', paddingBottom: '8px', marginBottom: '20px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.7 }}>
                      <span>VOLUME I</span>
                      <span>CONCLUSION</span>
                    </div>

                    <div style={{ fontSize: `${fontSize}rem`, textAlign: 'justify' }}>
                      {paragraphs.slice(6).length > 0 ? (
                        paragraphs.slice(6).map((p, idx) => (
                          <p 
                            key={idx}
                            onClick={() => handleParagraphClick(6 + idx)}
                            className={highlightedParagraphs[6 + idx] ? 'marker-highlight' : ''}
                            style={{ marginBottom: '20px', textIndent: '20px', cursor: highlighterActive ? 'pointer' : 'text', color: currentTheme.ink }}
                          >
                            {p}
                          </p>
                        ))
                      ) : (
                        <p style={{ fontStyle: 'italic', opacity: 0.8, color: 'var(--ink-light)', textAlign: 'center', marginTop: '60px' }}>
                          "And thus, the words settle in ink, ending their whimsical journey..."
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid rgba(78,62,46,0.12)', paddingTop: '10px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.6 }}>
                    <span>Page 4</span>
                  </div>
                </div>

                {/* Right Page: Gold Embossed Moral Plaque */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(78,62,46,0.15)', paddingBottom: '8px', marginBottom: '35px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.7 }}>
                      <span>VOLUME I</span>
                      <span>THE FINIS</span>
                    </div>

                    {/* Gold Embossed Moral Plaque */}
                    <div 
                      className="card-parchment card-embossed"
                      style={{
                        background: 'var(--bg-parchment-light)',
                        border: '2px solid var(--gold)',
                        boxShadow: '0 8px 25px rgba(140, 115, 82, 0.18)',
                        padding: '30px 25px',
                        borderRadius: '6px',
                        position: 'relative',
                        marginTop: '10px'
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
                          <Quote size={26} style={{ opacity: 0.5 }} />
                        </span>
                        <p style={{ 
                          fontFamily: 'Lora, serif',
                          fontStyle: 'italic',
                          fontSize: `${fontSize * 0.95}rem`,
                          fontWeight: '600',
                          lineHeight: '1.6',
                          color: 'var(--ink-dark)'
                        }}>
                          {story.moral}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(78,62,46,0.12)', paddingTop: '10px', fontSize: '0.75rem', fontFamily: 'Cinzel, serif', opacity: 0.6 }}>
                    <span>Page 5</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Book Footer Page indicator dots */}
          <div className="flex-center" style={{ marginTop: '35px', gap: '8px', opacity: 0.8 }}>
            {[0, 1, 2].map((idx) => (
              <span 
                key={idx}
                onClick={() => handleSpreadChange(idx, idx > currentSpread ? 'next' : 'prev')}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: currentSpread === idx ? 'var(--gold-dark)' : 'var(--bg-parchment-deep)',
                  cursor: 'pointer',
                  border: '1px solid rgba(78,62,46,0.15)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Book-flipping CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .marker-highlight {
          background: linear-gradient(104deg, rgba(255, 235, 59, 0.45) 0%, rgba(255, 235, 59, 0.65) 100%) !important;
          box-shadow: inset 0 -3px 0 rgba(255, 223, 0, 0.3);
          border-radius: 2px;
          padding: 0 4px;
          display: inline;
        }

        /* 3D Page flip animations */
        .book-container {
          perspective: 2000px;
          transition: transform 0.6s ease;
        }

        .flipping-next .book-pages {
          animation: flipPageNext 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
        }

        .flipping-prev .book-pages {
          animation: flipPagePrev 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
        }

        @keyframes flipPageNext {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
          }
          50% {
            transform: rotateY(-90deg) scale(0.98);
            opacity: 0.5;
            box-shadow: inset -20px 0 30px rgba(0,0,0,0.1);
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
          }
        }

        @keyframes flipPagePrev {
          0% {
            transform: rotateY(0deg);
            opacity: 1;
          }
          50% {
            transform: rotateY(90deg) scale(0.98);
            opacity: 0.5;
            box-shadow: inset 20px 0 30px rgba(0,0,0,0.1);
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
          }
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
