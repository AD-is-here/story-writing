import React, { useState, useEffect } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, BookOpen, Quote, Trash2, Highlighter, RotateCcw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const READ_THEMES = {
  parchment: { bg: '#f4ede4', paper: '#fbfbf7', ink: '#2a2015', label: 'Vintage' },
  antique: { bg: '#eae0d5', paper: '#f4ecd8', ink: '#322417', label: 'Antique' },
  charcoal: { bg: '#2b2621', paper: '#36302a', ink: '#f3e8dc', label: 'Ink Dark' }
};

const HIGHLIGHT_COLORS = {
  yellow: { class: 'color-yellow', hex: '#ffd54f', label: 'Yellow' },
  green: { class: 'color-green', hex: '#4caf50', label: 'Green' },
  blue: { class: 'color-blue', hex: '#03a9f4', label: 'Blue' },
  orange: { class: 'color-orange', hex: '#ff5722', label: 'Orange' }
};

export default function StoryReader({ story, onBack, onDeleteSuccess }) {
  const [fontSize, setFontSize] = useState(1.05); // rem
  const [themeName, setThemeName] = useState('parchment');
  const [deleting, setDeleting] = useState(false);

  // Highlighter State
  const [highlightKey, setHighlightKey] = useState(0); // Trigger re-render to clear manual DOM wraps
  const [floatingMenu, setFloatingMenu] = useState(null); // { x, y, bottomY, isBelow }
  const [editMenu, setEditMenu] = useState(null); // { node, x, y, bottomY, isBelow, currentColor }

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

  // Core Highlight wrapping logic
  const highlightRange = (selection, colorName) => {
    try {
      const range = selection.getRangeAt(0);
      const storyContainer = document.getElementById('story-content-container');
      
      // Ensure the selection lies entirely inside the story content container
      if (storyContainer && storyContainer.contains(range.commonAncestorContainer)) {
        const mark = document.createElement('mark');
        mark.className = `marker-highlight color-${colorName}`;
        
        // Wrap the selected range in our highlighted marker element
        range.surroundContents(mark);
        
        // Clear browser default highlight selection immediately (Kindle style)
        selection.removeAllRanges();
      }
    } catch (err) {
      console.warn("Selection crossed block boundaries, falling back to native styled selection.", err);
    }
  };

  const applyHighlight = (colorName) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      highlightRange(selection, colorName);
    }
    setFloatingMenu(null);
  };

  // Clear all highlights by forcing a re-render and wiping inline DOM wraps
  const handleClearHighlights = () => {
    setHighlightKey(prev => prev + 1);
  };

  const getHighlightColorFromNode = (node) => {
    if (!node) return 'yellow';
    if (node.classList.contains('color-yellow')) return 'yellow';
    if (node.classList.contains('color-green')) return 'green';
    if (node.classList.contains('color-blue')) return 'blue';
    if (node.classList.contains('color-orange')) return 'orange';
    return 'yellow';
  };

  const handleRemoveHighlight = (node) => {
    if (!node) return;
    node.replaceWith(...node.childNodes);
    setEditMenu(null);
  };

  const handleChangeColor = (node, newColorName) => {
    if (!node) return;
    node.classList.remove('color-yellow', 'color-green', 'color-blue', 'color-orange');
    node.classList.add(`color-${newColorName}`);
    setEditMenu(null);
  };

  const handleStoryContainerClick = (e) => {
    const highlightNode = e.target.closest('.marker-highlight');
    if (highlightNode) {
      // Clear selection so the browser native handles don't get in the way of editing!
      window.getSelection()?.removeAllRanges();
      
      const rect = highlightNode.getBoundingClientRect();
      setEditMenu({
        node: highlightNode,
        x: rect.left + rect.width / 2,
        y: rect.top,
        bottomY: rect.bottom,
        isBelow: rect.top < 85,
        currentColor: getHighlightColorFromNode(highlightNode)
      });
      setFloatingMenu(null); // Clear selection menu if active
    }
  };

  // Handle click outside highlight edit menu to close it
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const popup = document.getElementById('highlight-edit-popup');
      if (popup && !popup.contains(e.target) && !e.target.closest('.marker-highlight')) {
        setEditMenu(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Kindle-Style Text Selection Listener for both Desktop and Mobile
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setFloatingMenu(null);
        return;
      }

      const storyContainer = document.getElementById('story-content-container');
      if (storyContainer) {
        try {
          const range = selection.getRangeAt(0);
          if (storyContainer.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            setFloatingMenu({
              x: rect.left + rect.width / 2,
              y: rect.top,
              bottomY: rect.bottom,
              isBelow: rect.top < 85
            });
            return;
          }
        } catch (e) {
          // Ignore temporary range access during dragging
        }
      }
      setFloatingMenu(null);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleSelectionChange, { passive: true });
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleSelectionChange);
    };
  }, []);

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

        {/* Text Scaling, Multi-color Highlighter & Theme Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          

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
        {/* Book Container with custom text selection styling */}
        <div 
          className="card-parchment highlighter-active" 
          key={highlightKey}
          style={{
            background: currentTheme.paper,
            color: currentTheme.ink,
            border: '1px solid rgba(78, 62, 46, 0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            padding: '40px',
            position: 'relative',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'text',
            WebkitUserSelect: 'text',
            userSelect: 'text',
            touchAction: 'auto',
            WebkitTouchCallout: 'default'
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
            pointerEvents: 'none'
          }} />

          {/* Side-by-Side Double Page Layout */}
          <div 
            id="story-content-container" 
            className="book-pages" 
            onClick={handleStoryContainerClick}
            style={{
              display: 'grid',
              position: 'relative',
              zIndex: 1
            }}
          >
            
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
      
      {/* Floating Menu Capsules (Kindle/Medium-Style Popup) */}
      {floatingMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${floatingMenu.x}px`,
            top: floatingMenu.isBelow ? `${floatingMenu.bottomY + 8}px` : `${floatingMenu.y - 8}px`,
            transform: floatingMenu.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-parchment-deep)',
            padding: '6px 12px',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(42, 32, 21, 0.25)',
            border: '1px solid var(--gold-dark)',
            zIndex: 10000,
            pointerEvents: 'auto',
            animation: floatingMenu.isBelow ? 'scale-up-fade-below 0.15s ease-out' : 'scale-up-fade-above 0.15s ease-out'
          }}
        >
          {Object.entries(HIGHLIGHT_COLORS).map(([name, config]) => (
            <button
              key={name}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight(name);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyHighlight(name);
              }}
              style={{
                width: '14px',
                height: '22px',
                borderRadius: '4px',
                background: config.hex,
                border: '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              className="hover-scale"
              title={`Highlight active selection in ${config.label}`}
            />
          ))}
        </div>
      )}

      {/* Floating Highlight Edit Menu (Click on existing Highlight Popup) */}
      {editMenu && (
        <div
          id="highlight-edit-popup"
          style={{
            position: 'fixed',
            left: `${editMenu.x}px`,
            top: editMenu.isBelow ? `${editMenu.bottomY + 8}px` : `${editMenu.y - 8}px`,
            transform: editMenu.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-parchment-deep)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(42, 32, 21, 0.25)',
            border: '1px solid var(--gold-dark)',
            zIndex: 10000,
            pointerEvents: 'auto',
            animation: editMenu.isBelow ? 'scale-up-fade-below 0.15s ease-out' : 'scale-up-fade-above 0.15s ease-out'
          }}
        >
          {/* Delete Icon Button */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveHighlight(editMenu.node);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveHighlight(editMenu.node);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-crimson)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              transition: 'transform 0.15s ease',
            }}
            className="hover-scale"
            title="Delete Highlight"
          >
            <Trash2 size={16} />
          </button>

          {/* Vertical Divider */}
          <div style={{
            width: '1px',
            height: '16px',
            background: 'rgba(78, 62, 46, 0.2)',
            margin: '0 2px'
          }} />

          {/* Color Pills to change color */}
          {Object.entries(HIGHLIGHT_COLORS).map(([name, config]) => (
            <button
              key={name}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleChangeColor(editMenu.node, name);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleChangeColor(editMenu.node, name);
              }}
              style={{
                width: '14px',
                height: '22px',
                borderRadius: '4px',
                background: config.hex,
                border: editMenu.currentColor === name ? '2px solid var(--ink-dark)' : '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transform: editMenu.currentColor === name ? 'scale(1.1)' : 'scale(1)'
              }}
              className="hover-scale"
              title={`Change color to ${config.label}`}
            />
          ))}
        </div>
      )}

      {/* Styles for customizable selection and persistent highlights */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Custom selection overlay in browser */
        .highlighter-active ::selection {
          background: rgba(189, 162, 126, 0.25) !important;
          color: inherit !important;
        }
        .highlighter-active ::-moz-selection {
          background: rgba(189, 162, 126, 0.25) !important;
          color: inherit !important;
        }

        /* Persistent Highlight classes */
        .marker-highlight {
          border-radius: 2px;
          padding: 0 2px;
          display: inline;
          transition: background 0.3s ease;
        }

        .marker-highlight.color-yellow {
          background: linear-gradient(104deg, rgba(255, 235, 59, 0.45) 0%, rgba(255, 235, 59, 0.6) 100%) !important;
          box-shadow: inset 0 -2px 0 rgba(255, 223, 0, 0.3);
        }
        
        .marker-highlight.color-green {
          background: linear-gradient(104deg, rgba(76, 175, 80, 0.35) 0%, rgba(76, 175, 80, 0.5) 100%) !important;
          box-shadow: inset 0 -2px 0 rgba(76, 175, 80, 0.25);
        }

        .marker-highlight.color-blue {
          background: linear-gradient(104deg, rgba(3, 169, 244, 0.35) 0%, rgba(3, 169, 244, 0.5) 100%) !important;
          box-shadow: inset 0 -2px 0 rgba(3, 169, 244, 0.25);
        }

        .marker-highlight.color-orange {
          background: linear-gradient(104deg, rgba(255, 87, 34, 0.35) 0%, rgba(255, 87, 34, 0.5) 100%) !important;
          box-shadow: inset 0 -2px 0 rgba(255, 87, 34, 0.25);
        }

        /* Default mobile/tablet view (single column) */
        .book-pages {
          grid-template-columns: 1fr !important;
          gap: 30px !important;
        }
        .book-spine-divider {
          display: none !important;
        }

        /* Large tablets & desktop (side-by-side double page layout) */
        @media (min-width: 992px) {
          .book-pages {
            grid-template-columns: 1fr 1fr !important;
            gap: 60px !important;
          }
          .book-spine-divider {
            display: block !important;
          }
        }

        /* Floating Menu Animations and Hover Scale */
        @keyframes scale-up-fade-above {
          from {
            opacity: 0;
            transform: translate(-50%, -90%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        
        @keyframes scale-up-fade-below {
          from {
            opacity: 0;
            transform: translate(-50%, -10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        
        .hover-scale {
          transition: transform 0.15s ease !important;
        }
        .hover-scale:hover {
          transform: scale(1.22) !important;
        }
      `}} />

    </div>
  );
}
