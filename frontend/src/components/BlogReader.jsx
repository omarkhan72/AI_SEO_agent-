import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './BlogReader.css';

function BlogReader({ activeSlug, onBack }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeSlug) return;
    
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${activeSlug}`);
        setArticle(response.data);
      } catch (err) {
        console.error("Failed to load article:", err);
        if (err.response && err.response.status === 404) {
          setError("Content Not Found");
        } else {
          setError("Failed to fetch this article. Please verify your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [activeSlug]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="reader-container loading-state">
        <div className="spinner-large"></div>
        <p>Retrieving optimized draft from Firestore memory...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="reader-container error-state">
        <div className="error-icon">🔍</div>
        <h1>{error || "Content Not Found"}</h1>
        <p>The page or draft you are trying to view is either not published yet, or doesn't exist in our pipeline database.</p>
        <button className="btn-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <article className="reader-container">
      {/* Navigation */}
      <nav className="reader-nav">
        <button className="btn-back" onClick={onBack}>
          ← Back to Command Center
        </button>
        <span className="reader-breadcrumb">Blog / {article.slug}</span>
      </nav>

      {/* Hero Header */}
      <header className="reader-header">
        <div className="reader-meta">
          <span className="meta-keyword">{article.target_keyword}</span>
          <span className="meta-dot">•</span>
          <span className="meta-date">Published on {formatDate(article.created_at)}</span>
        </div>
        
        <h1 className="reader-title">{article.title}</h1>
        
        <div className="author-card">
          <div className="author-avatar">OK</div>
          <div className="author-info">
            <span className="author-name">{article.author || "Omar Khan"}</span>
            <span className="author-role">SEO Agent Lead Architect</span>
          </div>
        </div>
      </header>

      {/* Main Rendered Content */}
      <main className="reader-content">
        <ReactMarkdown>{article.markdown_body}</ReactMarkdown>
      </main>

      {/* Footer CTA */}
      <footer className="reader-footer">
        <div className="footer-line"></div>
        <p>This article was autonomously researched, planned, and written by our custom node AI Agent loop using <strong>gpt-4o-mini</strong> and verified live SERP context.</p>
        <button className="btn-back-bottom" onClick={onBack}>
          ← Return to Command Center
        </button>
      </footer>
    </article>
  );
}

export default BlogReader;
