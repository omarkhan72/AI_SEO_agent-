import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import BlogReader from './components/BlogReader';
import './App.css';

function App() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentStep, setAgentStep] = useState(0); // 0: Idle, 1: SERP, 2: Planner, 3: Writer, 4: Database
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [error, setError] = useState('');
  const [activeSlug, setActiveSlug] = useState('');

  // Listen to hash changes for simple client routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/blog/')) {
        setActiveSlug(hash.replace('#/blog/', ''));
      } else {
        setActiveSlug('');
      }
    };

    handleHashChange(); // Run once on load
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch all drafts on initial load
  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/drafts');
      setDrafts(response.data);
    } catch (err) {
      console.error("Failed to load drafts:", err);
      setError("Unable to connect to the backend server. Please verify the backend is running.");
    }
  };

  const handleRunAgent = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    
    // Simulate agent steps with visual delays
    setAgentStep(1); // SERP Context
    
    try {
      // Step 1: SERP Context check (simulated duration for rich UI experience)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAgentStep(2); // Structured Blueprint
      
      // Step 2: Structured Blueprint planning
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAgentStep(3); // Drafting content
      
      // Step 3: Call composition API which runs SERP + Plan + Write loop + Firebase save
      const response = await axios.post('http://localhost:5000/api/agent/compose', {
        keyword: keyword
      });
      
      setAgentStep(4); // Firebase Save completed
      await new Promise(resolve => setTimeout(resolve, 800));

      setKeyword('');
      fetchDrafts(); // Reload list
    } catch (err) {
      console.error("Error executing agent:", err);
      setError("AI generation failed or server timed out. Please try again.");
    } finally {
      setLoading(false);
      setAgentStep(0);
    }
  };

  const handlePublish = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/drafts/${id}/publish`);
      // Update local state by filtering out the published item
      setDrafts(prev => prev.filter(draft => draft.id !== id));
      if (selectedDraft && selectedDraft.id === id) {
        setSelectedDraft(null);
      }
    } catch (err) {
      console.error("Failed to publish draft:", err);
      alert("Error occurred while publishing the draft.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    // If Firestore server timestamp format {_seconds: X, _nanoseconds: Y}
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString();
    }
    // Standard Date string
    return new Date(timestamp).toLocaleString();
  };

  if (activeSlug) {
    return (
      <BlogReader
        activeSlug={activeSlug}
        onBack={() => {
          window.location.hash = '';
          setActiveSlug('');
        }}
      />
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>SEO Agent Command Center</h1>
          <p>Autonomously scrape search ranks, blueprint layout, write sections, and stage content.</p>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          SEO Engine Live
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
            Control Console
          </h2>
          <form onSubmit={handleRunAgent}>
            <div className="form-group">
              <label htmlFor="keyword-input">Target SEO Search Keyword</label>
              <div className="input-wrapper">
                <input
                  id="keyword-input"
                  type="text"
                  className="text-input"
                  placeholder="e.g. Docker Container Security Best Practices"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || !keyword.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>🚀</span> Run Autonomous SEO Agent
                </>
              )}
            </button>
          </form>

          {/* Dynamic Progress Indicator */}
          {loading && (
            <div className="progress-container">
              <div className="progress-header">
                <span className="spinner"></span>
                <span className="progress-title">Agent Execution In Progress...</span>
              </div>
              <div className="progress-steps">
                <div className={`progress-step ${agentStep >= 1 ? (agentStep > 1 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{agentStep > 1 ? '✓' : '1'}</span>
                  <span>Scraping live SERP context for keyword</span>
                </div>
                <div className={`progress-step ${agentStep >= 2 ? (agentStep > 2 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{agentStep > 2 ? '✓' : '2'}</span>
                  <span>Planning content structure and headings (gpt-4o-mini)</span>
                </div>
                <div className={`progress-step ${agentStep >= 3 ? (agentStep > 3 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{agentStep > 3 ? '✓' : '3'}</span>
                  <span>Iteratively drafting article markdown sections</span>
                </div>
                <div className={`progress-step ${agentStep >= 4 ? (agentStep > 4 ? 'completed' : 'active') : ''}`}>
                  <span className="step-icon">{agentStep > 4 ? '✓' : '4'}</span>
                  <span>Archiving optimized copy to Firestore memory</span>
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
                <p>No content in queue. Enter a keyword on the left to fire up your content writing pipeline!</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="draft-item">
                  <div className="draft-meta">
                    <h3>{draft.title}</h3>
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
                    <button 
                      className="btn-success"
                      onClick={() => handlePublish(draft.id)}
                    >
                      Publish
                    </button>
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
              </div>
              
              <div className="markdown-preview">
                <ReactMarkdown>{selectedDraft.markdown_body}</ReactMarkdown>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedDraft(null)}>Close</button>
              <button className="btn-success" onClick={() => handlePublish(selectedDraft.id)}>Publish Live</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
