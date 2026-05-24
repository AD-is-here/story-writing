import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, Search, LogOut, Plus, BookText, Filter } from 'lucide-react';

export default function Dashboard({ session, onSelectStory, onCreateNew, onLogout }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');

  // Extract clean username from session email
  const displayUsername = session?.user?.email?.split('@')[0] || 'Librarian';

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter stories by title or keywords
  const filteredStories = stories.filter(story => {
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = story.title.toLowerCase().includes(query);
    const keywordMatch = story.keywords.some(k => k.toLowerCase().includes(query));
    
    if (filterKeyword) {
      const keywordFilterMatch = story.keywords.some(k => k.toLowerCase() === filterKeyword.toLowerCase());
      return keywordFilterMatch && (titleMatch || keywordMatch);
    }
    
    return titleMatch || keywordMatch;
  });

  // Extract all unique keywords across all stories for the filter pill bar
  const allKeywords = Array.from(
    new Set(stories.flatMap(story => story.keywords))
  ).slice(0, 12); // Limit to top 12 keywords for clean UI

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0 60px' }}>
      
      {/* Premium Dashboard Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '40px',
          borderBottom: '2px solid rgba(78, 62, 46, 0.15)',
          paddingBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--gold-dark)' }}><BookOpen size={28} /></span>
            <h1 style={{ fontSize: '2.2rem', margin: 0, textTransform: 'uppercase' }}>
              The Archive
            </h1>
          </div>
          <p style={{ fontStyle: 'italic', color: 'var(--ink-light)', fontSize: '0.9rem', marginTop: '4px' }}>
            Welcome, Scribe <strong style={{ color: 'var(--ink-dark)' }}>{displayUsername}</strong> — reviewing your collections
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-vintage flex-center"
            onClick={onCreateNew}
          >
            <Plus size={18} />
            <span>Weave Story</span>
          </button>
          
          <button 
            className="btn-vintage-secondary flex-center"
            onClick={onLogout}
            style={{ padding: '10px 16px' }}
          >
            <LogOut size={16} />
            <span>Exit Study</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar Panel */}
      <div 
        className="card-parchment"
        style={{
          padding: '20px',
          border: '1px solid rgba(78, 62, 46, 0.15)',
          marginBottom: '40px',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', width: '100%' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }}>
              <Search size={18} />
            </span>
            <input 
              type="text" 
              className="input-desk"
              placeholder="Search scrolls by title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>

        {/* Keyword Filter Pills */}
        {allKeywords.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'Cinzel, serif', fontWeight: '700', color: 'var(--ink-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} /> Filter:
            </span>
            <button
              onClick={() => setFilterKeyword('')}
              style={{
                background: filterKeyword === '' ? 'var(--ink-dark)' : 'transparent',
                color: filterKeyword === '' ? 'var(--bg-parchment-light)' : 'var(--ink-medium)',
                border: '1px solid var(--ink-muted)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              All Scrolls
            </button>
            {allKeywords.map((word) => (
              <button
                key={word}
                onClick={() => setFilterKeyword(word)}
                style={{
                  background: filterKeyword === word ? 'var(--ink-dark)' : 'rgba(189, 162, 126, 0.1)',
                  color: filterKeyword === word ? 'var(--bg-parchment-light)' : 'var(--ink-medium)',
                  border: filterKeyword === word ? '1px solid var(--ink-dark)' : '1px solid rgba(189, 162, 126, 0.3)',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                #{word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bookshelf Section */}
      <div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--ink-dark)', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookText size={20} />
          <span>Standing Scrolls ({filteredStories.length})</span>
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontStyle: 'italic', color: 'var(--ink-light)' }}>
            Dusting the library shelves...
          </div>
        ) : filteredStories.length === 0 ? (
          /* Empty Shelf State */
          <div 
            className="card-parchment card-embossed"
            style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              border: '1px dashed rgba(78, 62, 46, 0.3)',
              background: 'transparent'
            }}
          >
            <p style={{ fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--ink-light)', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
              "Your shelf stands empty. Dust gathers in the silence. Gather five keywords to weave a new tapestry of words and inscribe your first volume."
            </p>
            <button 
              className="btn-vintage" 
              style={{ marginTop: '25px' }}
              onClick={onCreateNew}
            >
              <Plus size={16} />
              <span>Inscribe First Scroll</span>
            </button>
          </div>
        ) : (
          /* Bookshelf Grid */
          <div>
            {/* Split books into rows with library shelves under them */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
              gap: '40px 20px',
              paddingBottom: '20px'
            }}>
              {filteredStories.map((story) => (
                <div key={story.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  
                  {/* Stand-up Book Item */}
                  <div className="book-spine-wrapper" onClick={() => onSelectStory(story)}>
                    <div 
                      className="book-spine-cover"
                      style={{ 
                        backgroundColor: story.cover_color || '#5c1d24',
                        color: 'var(--gold-light)'
                      }}
                    >
                      {/* Spine detail line */}
                      <div className="book-spine-line" />
                      
                      {/* Embossed gold stamp details */}
                      <div className="book-gold-stamp">
                        {/* Top Accent */}
                        <div style={{ fontSize: '0.6rem', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em', opacity: 0.8 }}>
                          TALE
                        </div>

                        {/* Title */}
                        <div style={{ 
                          fontFamily: 'Cinzel, serif', 
                          fontWeight: '700', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.3',
                          maxHeight: '110px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          padding: '0 5px',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {story.title}
                        </div>

                        {/* Bottom Author/Keywords */}
                        <div style={{ width: '100%' }}>
                          <div style={{ fontSize: '0.55rem', opacity: 0.8, fontFamily: 'Cinzel, serif', borderTop: '1px solid rgba(237,216,191,0.2)', paddingTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {story.keywords.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standing Book shadow & title under */}
                  <div style={{ textAlign: 'center', marginTop: '14px', maxWidth: '160px' }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontFamily: 'Cinzel, serif', 
                      fontWeight: '700', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      color: 'var(--ink-dark)'
                    }}>
                      {story.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--ink-light)', marginTop: '2px' }}>
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Shelf element directly under this row of books */}
                  <div style={{ width: '100%', height: '1px' }} />

                </div>
              ))}
            </div>

            {/* Bookshelf bottom footer board */}
            <div className="library-shelf" />
          </div>
        )}
      </div>

    </div>
  );
}
