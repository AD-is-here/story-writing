import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Feather, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react';

const WRITING_PHRASES = [
  "Searching the library archives...",
  "Dipping the quill in walnut ink...",
  "Drafting the characters on fresh parchment...",
  "Weaving a deep moral into the narrative...",
  "Inscribing the final verses...",
  "Sealing the scroll with golden wax..."
];

const LEATHER_COLORS = [
  "#5c1d24", // Crimson
  "#1c3d27", // Forest Green
  "#1a2f4c", // Navy Blue
  "#5a3c20", // Saddle Brown
  "#3d1f42"  // Deep Plum
];

export default function StoryCreator({ session, onStoryCreated, onCancel }) {
  const [keywords, setKeywords] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [writingPhraseIndex, setWritingPhraseIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeywordChange = (index, value) => {
    // Only allow single words without spaces
    const cleanValue = value.replace(/\s/g, '');
    const newKeywords = [...keywords];
    newKeywords[index] = cleanValue;
    setKeywords(newKeywords);
  };

  // Whimsical phrase cycler during generation
  const startPhraseCycler = () => {
    setWritingPhraseIndex(0);
    const interval = setInterval(() => {
      setWritingPhraseIndex((prev) => {
        if (prev < WRITING_PHRASES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3500);
    return interval;
  };

  const generateStory = async (e) => {
    e.preventDefault();
    
    // Validate keywords
    const filteredKeywords = keywords.map(k => k.trim()).filter(k => k !== '');
    if (filteredKeywords.length !== 5) {
      setErrorMsg("Please provide exactly five keywords to weave your tale.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const phraseInterval = startPhraseCycler();

    try {
      let storyData = null;

      // 1. Attempt Vercel Serverless Function first
      try {
        const response = await fetch('/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: filteredKeywords }),
        });

        if (response.ok) {
          storyData = await response.json();
        }
      } catch (err) {
        console.warn("Vercel Serverless Function unavailable. Attempting local client fallback...", err);
      }

      // 2. If Vercel API fails/404s, try client-side Gemini fallback if API key is provided
      if (!storyData) {
        const localGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (localGeminiKey) {
          storyData = await generateClientSideStory(filteredKeywords, localGeminiKey);
        }
      }

      // 3. Ultimate beautiful Mock Story fallback if no API keys are available
      if (!storyData) {
        console.log("No API key found. Generating high-quality parchment mock story...");
        storyData = generatePremiumMockStory(filteredKeywords);
      }

      // Select a random vintage leather color for the cover
      const randomColor = LEATHER_COLORS[Math.floor(Math.random() * LEATHER_COLORS.length)];

      // 4. Save to Supabase
      const { data, error } = await supabase
        .from('stories')
        .insert([
          {
            user_id: session.user.id,
            keywords: filteredKeywords,
            title: storyData.title,
            content: storyData.story,
            moral: storyData.moral,
            cover_color: randomColor
          }
        ])
        .select();

      if (error) throw error;

      clearInterval(phraseInterval);
      if (data && data.length > 0) {
        onStoryCreated(data[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || "The magic failed to weave your story. Please try again.");
      clearInterval(phraseInterval);
    } finally {
      setLoading(false);
    }
  };

  // Client-Side Gemini Integration
  const generateClientSideStory = async (keywordsList, apiKey) => {
    const prompt = `Write a short, engaging story of exactly 500 words. It must be highly readable, suitable for all ages, and teach a clear moral lesson. The story MUST revolve around these 5 keywords: ${keywordsList.join(', ')}. 
    
    Format your output strictly as a JSON object with exactly these three keys:
    {
      "title": "Title of the Story",
      "story": "The full story text structured with multiple paragraphs...",
      "moral": "The moral lesson in one concise sentence."
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const result = await response.json();
    const textResponse = result.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse);
  };

  // High-Quality Whimsical Fallback Story
  const generatePremiumMockStory = (k) => {
    return {
      title: `The Tale of the Whispering ${k[0].charAt(0).toUpperCase() + k[0].slice(1)}`,
      story: `Deep within the heart of an ancient forest, where the moss grew thick and the trees whispered secrets of old, stood a tiny cottage. In it lived a young seeker named Leo. Leo possessed a mysterious and beautiful ${k[0]}, which had been passed down through generations of his family. It was no ordinary object; whenever the wind blew, it produced a soft, chiming melody that brought peace to anyone who heard it.\n\nOne bright morning, a mischievous little ${k[1]} wandered out of the shadows. Seeing the glistening ${k[0]} resting on Leo's windowsill, the creature couldn't resist the urge to swipe it. With a quick leap, the ${k[1]} snatched the treasure and scurried up into the high branches of the canopy.\n\nWhen Leo discovered his loss, his heart sank. But instead of growing angry, he grabbed his trusted ${k[2]} and decided to embark on a quest. He knew that anger would solve nothing, but determination and cleverness would. Following a trail of glowing dust, he entered the deepest parts of the woods, where a roaring ${k[3]} blocked his path. The river was wild and impassable. Thinking quickly, Leo used his ${k[2]} to hook onto a sturdy vine above, swinging gracefully across the raging waters.\n\nOn the other side, he finally cornered the ${k[1]} under a massive, hollow oak. The creature looked frightened, clutching the stolen item close to its chest. Realizing the thief was lonely rather than malicious, Leo reached into his pocket and offered a golden ${k[4]} he had brought along. The creature's eyes lit up. It gently handed back the musical ${k[0]} in exchange for the warm, glowing ${k[4]}.\n\nAs the soft chimes echoed once more through the clearing, Leo and the creature shared a smile of understanding, bound by a new friendship. Leo returned home, his heart full and his spirit enriched by the magical journey.`,
      moral: `True resolution is found not through anger or force, but through resourcefulness, empathy, and understanding.`
    };
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0' }}>
      <div 
        className="card-parchment card-embossed" 
        style={{ 
          maxWidth: '650px', 
          margin: '0 auto', 
          padding: '40px',
          border: '1px solid rgba(140, 115, 82, 0.35)',
          boxShadow: '0 20px 50px rgba(42, 32, 21, 0.2)'
        }}
      >
        {/* Loading / Writing State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="flex-center animate-quill" style={{ color: 'var(--gold-dark)', marginBottom: '30px' }}>
              {/* Custom SVG Feather Quill */}
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" strokeWidth="2" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
            </div>
            
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--ink-dark)', marginBottom: '10px' }}>
              Weaving Your Tale
            </h3>
            
            {/* Animated status text */}
            <p className="font-serif-vintage" style={{ fontStyle: 'italic', color: 'var(--gold-dark)', fontSize: '1.05rem', minHeight: '30px' }}>
              {WRITING_PHRASES[writingPhraseIndex]}
            </p>

            <div style={{ 
              maxWidth: '300px', 
              height: '3px', 
              background: 'var(--bg-parchment-deep)', 
              margin: '25px auto 0',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '60%',
                background: 'var(--ink-dark)',
                borderRadius: '2px',
                animation: 'loading-bar 1.5s infinite ease-in-out'
              }} />
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes loading-bar {
                  0% { left: -60%; }
                  50% { left: 40%; }
                  100% { left: 100%; }
                }
              `}} />
            </div>
          </div>
        ) : (
          /* Input Form State */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--ink-dark)', marginBottom: '6px' }}>
                Weave a New Story
              </h2>
              <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--ink-light)' }}>
                Provide five keywords and watch the ink fill the parchment
              </p>
            </div>

            <form onSubmit={generateStory} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Instruction Banner */}
              <div 
                style={{ 
                  background: 'var(--bg-parchment-dark)', 
                  border: '1px dashed rgba(78, 62, 46, 0.25)', 
                  padding: '16px 20px', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  color: 'var(--ink-medium)'
                }}
              >
                <strong>Rules of Scribing:</strong> Enter one distinct word in each of the scroll containers below. The AI will weave a unique 500-word fable complete with a rich moral lesson. Avoid phrases or spaces.
              </div>

              {/* Keyword Fields Layout */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
                gap: '15px', 
                marginTop: '10px' 
              }}>
                {keywords.map((word, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <label 
                      style={{ 
                        fontFamily: 'Cinzel, serif', 
                        fontSize: '0.7rem', 
                        fontWeight: '700', 
                        letterSpacing: '0.05em',
                        color: 'var(--ink-light)',
                        display: 'block',
                        marginBottom: '6px'
                      }}
                    >
                      Scroll {idx + 1}
                    </label>
                    <input 
                      type="text"
                      className="input-desk"
                      placeholder="Keyword"
                      value={word}
                      onChange={(e) => handleKeywordChange(idx, e.target.value)}
                      style={{ 
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        borderBottom: '2px solid var(--gold-dark)',
                        borderRadius: '0',
                        background: 'transparent',
                        padding: '8px 4px'
                      }}
                      maxLength={20}
                      required
                    />
                  </div>
                ))}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <strong>Validation Warning:</strong>
                  </div>
                  <p style={{ marginTop: '4px' }}>{errorMsg}</p>
                </div>
              )}

              {/* Actions Grid */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '15px',
                borderTop: '1px solid rgba(78, 62, 46, 0.15)',
                paddingTop: '25px'
              }}>
                <button 
                  type="button" 
                  className="btn-vintage-secondary"
                  onClick={onCancel}
                >
                  <RotateCcw size={16} />
                  <span>Return to Shelf</span>
                </button>

                <button 
                  type="submit" 
                  className="btn-vintage"
                >
                  <Feather size={16} />
                  <span>Weave Story</span>
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
