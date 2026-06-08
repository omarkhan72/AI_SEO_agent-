import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

// Highly realistic initial mock data
const INITIAL_DRAFTS = [
  {
    id: '1',
    title: 'Next.js 15 App Router: Mastering Server Components',
    target_keyword: 'Next.js 15 App Router',
    slug: 'nextjs-15-app-router-server-components',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'published',
    markdown_body: `## Introduction
Next.js 15 introduces powerful optimizations for Server Components, enabling developers to build fast, secure, and content-rich applications out of the box. By moving rendering workloads to the build phase or server side, Server Components minimize client-side JavaScript execution.

## Why Server Components?
Server Components allow you to fetch data, access server-only resources (like databases or APIs), and keep sensitive credentials secure without exposing them to the browser.
* **Zero Client-Side JavaScript**: Server Components render completely on the server, meaning their logic code is omitted from client bundles.
* **Data Fetching Proximity**: Fetching data directly on the server reduces latency and simplifies state synchronization.
* **SEO & Crawlability**: Fully rendered HTML is delivered to search engine indexers, drastically improving search presence.

## Modern Styling & Layouts
Integrating Tailwind or custom CSS within React Server Components is smooth and automatic. You get full server-side markup generation combined with interactive client islands wherever necessary.`
  },
  {
    id: '2',
    title: 'Mastering CSS Grid & Flexbox: A Pragmatic Layout Guide',
    target_keyword: 'CSS Grid layout',
    slug: 'css-grid-flexbox-layout-guide',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    status: 'draft',
    markdown_body: `## Introduction
CSS Grid and Flexbox are the twin pillars of modern web layout design. Understanding when to apply Grid (two-dimensional control) versus Flexbox (one-dimensional flow) resolves 90% of visual design frustrations.

## CSS Grid vs Flexbox
* **Grid**: Best suited for macro-layouts where elements must align along rows *and* columns concurrently (e.g. dashboards, card listings).
* **Flexbox**: Best suited for micro-layouts, content alignment, and single-direction stacks (e.g. navigation menus, header bars, item tags).

## Code Structure Example
\`\`\`css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
\`\`\`
Use CSS Grid to build robust, screen-resizing dashboards with fluid structures.`
  }
];

function App() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [credits, setCredits] = useState(50);
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [error, setError] = useState('');
  
  // Track simulation step index for active status message rotation
  const [stepIndex, setStepIndex] = useState(0);

  // Status text messages rotated every second during mock run
  const statusSteps = [
    'Scraping live web search SERP context...',
    'Analyzing search keywords and planning article outline...',
    'GPT-4o-mini is iteratively composing article sections...',
    'Finalizing article copy and formatting raw markdown...',
    'Draft saved to Firestore database collection...'
  ];

  // Rotate status message every 1 second when loading is active
  useEffect(() => {
    let interval;
    if (loading) {
      setStepIndex(0);
      setStatusText(statusSteps[0]);
      
      interval = setInterval(() => {
        setStepIndex((prev) => {
          const next = prev + 1;
          if (next < statusSteps.length) {
            setStatusText(statusSteps[next]);
            return next;
          }
          return prev;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [loading]);

  const handleRunAgent = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Live Axios POST request to http://localhost:5000/api/plan-content
      const response = await axios.post('http://localhost:5000/api/plan-content', {
        keyword: keyword.trim()
      });

      // Confirm success structure response.data.success and response.data.data
      if (response.data && response.data.success && response.data.data) {
        const outline = response.data.data;
        const cleanedKeyword = keyword.trim();

        const newDraft = {
          id: Date.now().toString(),
          title: outline.title,
          target_keyword: cleanedKeyword,
          slug: outline.slug,
          created_at: new Date().toISOString(),
          status: 'draft',
          markdown_body: `## Outline Blueprint\n\nThis is the generated outline structure for **${cleanedKeyword}**:\n\n${outline.headings.map(h => `* ${h}`).join('\n')}\n\n*Draft is ready for composition!*`
        };

        setDrafts(prev => [newDraft, ...prev]);
        setCredits(prev => Math.max(0, prev - 1));
        setKeyword('');
      } else {
        throw new Error("Invalid response format received from backend");
      }
    } catch (err) {
      console.error("Error executing agent plan:", err);
      setError("Could not connect to backend server on port 5000. Please verify the server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = (id) => {
    setDrafts(prev =>
      prev.map(draft =>
        draft.id === id ? { ...draft, status: 'published' } : draft
      )
    );
    // If the published article is currently open in the preview modal, sync its status
    if (selectedDraft && selectedDraft.id === id) {
      setSelectedDraft(prev => ({ ...prev, status: 'published' }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      min: '2-digit'
    });
  };

  // Switch routing based on hash routing (for the BlogReader demo path)
  // We can mock the reader view inside App.jsx or let it fall back
  const [activeSlug, setActiveSlug] = useState('');
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/blog/')) {
        setActiveSlug(hash.replace('#/blog/', ''));
      } else {
        setActiveSlug('');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simple clean reader component inside App flow
  if (activeSlug) {
    const matchedArticle = drafts.find(d => d.slug === activeSlug);
    
    return (
      <div className="reader-wrapper" style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
        <button 
          className="btn-secondary" 
          onClick={() => {
            window.location.hash = '';
            setActiveSlug('');
          }}
          style={{ marginBottom: '30px' }}
        >
          ← Back to Studio
        </button>
        {matchedArticle && matchedArticle.status === 'published' ? (
          <article>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <span className="draft-keyword">{matchedArticle.target_keyword}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>• Published {formatDate(matchedArticle.created_at)}</span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: '700', color: 'white', marginBottom: '30px', lineHeight: '1.25' }}>{matchedArticle.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>OK</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>Omar Khan</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SEO Lead Architect</div>
              </div>
            </div>
            <div className="markdown-preview" style={{ color: '#d1d5db', fontSize: '18px', lineHeight: '1.75' }}>
              <ReactMarkdown>{matchedArticle.markdown_body}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>🔍 Content Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>This article is either not published yet, or doesn't exist.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>SEO Agent Studio</h1>
          <p>Scrape context, blueprint outlines, and write search-optimized technical drafts automatically.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="status-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}>
            ⚡ Credits Remaining: {credits}
          </div>
          <div className="status-badge">
            <span className="status-dot"></span>
            Simulation Sandbox
          </div>
        </div>
      </header>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '30px',
          color: '#f87171',
          fontSize: '15px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="dashboard-grid">
        {/* Left Column: Input Control Panel */}
        <section className="panel-card">
          <h2>
            <span style={{ fontSize: '24px' }}>⚡</span>
            Agent Configuration
          </h2>
          <form onSubmit={handleRunAgent}>
            <div className="form-group">
              <label htmlFor="keyword-input">Target SEO Keyword</label>
              <div className="input-wrapper">
                <input
                  id="keyword-input"
                  type="text"
                  className="text-input"
                  placeholder="Enter target keyword (e.g., React Native optimization)..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            {!loading && (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={!keyword.trim()}
              >
                <span>🚀</span> Run SEO Agent
              </button>
            )}
          </form>

          {/* Dynamic Progress Indicator */}
          {loading && (
            <div className="progress-container" style={{ marginTop: '0' }}>
              <div className="progress-header" style={{ marginBottom: '16px' }}>
                <span className="spinner"></span>
                <span className="progress-title" style={{ color: 'var(--input-focus)' }}>Agent Running...</span>
              </div>
              <div style={{ color: '#d1d5db', fontSize: '14px', fontStyle: 'italic', marginBottom: '14px' }}>
                "{statusText}"
              </div>
              <div className="progress-steps">
                <div className={`progress-step ${stepIndex >= 0 ? (stepIndex > 0 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{stepIndex > 0 ? '✓' : '1'}</span>
                  <span>SERP scraping</span>
                </div>
                <div className={`progress-step ${stepIndex >= 1 ? (stepIndex > 1 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{stepIndex > 1 ? '✓' : '2'}</span>
                  <span>Outline blueprint mapping</span>
                </div>
                <div className={`progress-step ${stepIndex >= 2 ? (stepIndex > 2 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{stepIndex > 2 ? '✓' : '3'}</span>
                  <span>Iterative markdown section composing</span>
                </div>
                <div className={`progress-step ${stepIndex >= 4 ? 'completed' : 'active'}`}>
                  <span className="step-icon">{stepIndex >= 4 ? '✓' : '4'}</span>
                  <span>Database indexing</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Review Staging Board */}
        <section className="panel-card">
          <h2>
            <span style={{ fontSize: '24px' }}>📁</span>
            Staging Board (Drafts)
          </h2>
          
          <div className="drafts-list">
            {drafts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No content in queue. Enter a keyword on the left to generate drafts.</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="draft-item">
                  <div className="draft-meta">
                    <h3 
                      onClick={() => setSelectedDraft(draft)} 
                      style={{ cursor: 'pointer', hover: { textDecoration: 'underline' } }}
                    >
                      {draft.title}
                    </h3>
                    <div className="draft-meta-details">
                      <span className="draft-keyword">{draft.target_keyword}</span>
                      <span className="draft-date">{formatDate(draft.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="draft-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => setSelectedDraft(draft)}
                    >
                      Preview
                    </button>
                    {draft.status === 'draft' ? (
                      <button 
                        className="btn-success"
                        onClick={() => handlePublish(draft.id)}
                      >
                        Publish Live
                      </button>
                    ) : (
                      <button 
                        className="btn-secondary" 
                        disabled 
                        style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399', cursor: 'default', opacity: '1' }}
                      >
                        Published ✓
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Rendered Preview Overlay Modal */}
      {selectedDraft && (
        <div className="modal-overlay" onClick={() => setSelectedDraft(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDraft.title}</h2>
              <button className="btn-close" onClick={() => setSelectedDraft(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <strong>Original Keyword:</strong> <span style={{ color: '#c084fc' }}>{selectedDraft.target_keyword}</span>
                <br />
                <strong>URL Slug:</strong> <span style={{ color: '#a78bfa' }}>/blog/{selectedDraft.slug}</span>
                <br />
                <strong>Status:</strong> <span style={{ color: selectedDraft.status === 'published' ? '#34d399' : '#f59e0b' }}>
                  {selectedDraft.status === 'published' ? 'Published Live' : 'Draft Staged'}
                </span>
                {selectedDraft.status === 'published' && (
                  <>
                    <br />
                    <strong>Public URL:</strong> <a href={`#/blog/${selectedDraft.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>
                      {window.location.origin}/#/blog/{selectedDraft.slug}
                    </a>
                  </>
                )}
              </div>
              
              <div className="markdown-preview">
                <ReactMarkdown>{selectedDraft.markdown_body}</ReactMarkdown>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedDraft(null)}>Close</button>
              {selectedDraft.status === 'draft' ? (
                <button 
                  className="btn-success" 
                  onClick={() => handlePublish(selectedDraft.id)}
                >
                  Publish Live
                </button>
              ) : (
                <a 
                  href={`#/blog/${selectedDraft.slug}`} 
                  onClick={() => setSelectedDraft(null)}
                  className="btn-primary" 
                  style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 18px', fontSize: '13px' }}
                >
                  View Live Article
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
