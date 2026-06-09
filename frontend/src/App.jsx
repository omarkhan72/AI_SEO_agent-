import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Toaster } from 'react-hot-toast';
import { 
  FileText, 
  Sparkles, 
  Eye, 
  Send, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Overview from './pages/Overview.jsx';
import { useAgentAPI } from './hooks/useAgentAPI.js';

const INITIAL_DRAFTS = [
  {
    id: '1',
    title: 'Next.js 15 App Router: Mastering Server Components',
    target_keyword: 'Next.js 15 App Router',
    slug: 'nextjs-15-app-router-server-components',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    markdown_body: `## Introduction
Next.js 15 introduces powerful optimizations for Server Components, enabling developers to build fast, secure, and content-rich applications out of the box.

## Why Server Components?
Server Components allow you to fetch data, access server-only resources, and keep sensitive credentials secure without exposing them to the browser.`
  },
  {
    id: '2',
    title: 'Mastering CSS Grid & Flexbox: A Pragmatic Layout Guide',
    target_keyword: 'CSS Grid layout',
    slug: 'css-grid-flexbox-layout-guide',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
    markdown_body: `## Introduction
CSS Grid and Flexbox are the twin pillars of modern web layout design.`
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeDomain, setActiveDomain] = useState('example.com');
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
  const [selectedDraft, setSelectedDraft] = useState(null);
  
  // Content Pipeline Input State
  const [planKeyword, setPlanKeyword] = useState('');
  
  // AI Chat Consultant State
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI SEO Consultant. Ask me anything about your current SEO technical audit scores, target audience profiles, or keywords. How can I assist you today?' }
  ]);

  const { loadingStates, planContent, sendChatMessage } = useAgentAPI();
  const chatBottomRef = useRef(null);

  // Auto Scroll Chat to bottom on history change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planKeyword.trim()) return;

    try {
      const result = await planContent(planKeyword.trim());
      if (result && result.success && result.data) {
        const outline = result.data;
        const newDraft = {
          id: result.documentId || Date.now().toString(),
          title: outline.title,
          target_keyword: planKeyword.trim(),
          slug: outline.slug,
          created_at: new Date().toISOString(),
          status: 'draft',
          markdown_body: `## Outline Blueprint\n\nGenerated structure for **${planKeyword.trim()}**:\n\n${outline.headings.map(h => `* ${h}`).join('\n')}\n\n*Ready to write!*`
        };
        setDrafts(prev => [newDraft, ...prev]);
        setPlanKeyword('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (id) => {
    try {
      // Direct mock update to published status
      setDrafts(prev =>
        prev.map(d => d.id === id ? { ...d, status: 'published' } : d)
      );
      if (selectedDraft && selectedDraft.id === id) {
        setSelectedDraft(prev => ({ ...prev, status: 'published' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingStates.chat) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const result = await sendChatMessage(activeDomain, chatSessionId, userMsg);
      if (result && result.success) {
        setChatSessionId(result.sessionId);
        setChatHistory(result.history || []);
      }
    } catch (err) {
      setChatHistory(prev => [
        ...prev, 
        { role: 'assistant', content: '⚠️ Service error: Unable to reach the consulting engine. Please check your backend is active.' }
      ]);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      activeDomain={activeDomain} 
      setActiveDomain={setActiveDomain}
    >
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <Overview activeDomain={activeDomain} />
      )}

      {/* Content Pipeline Tab */}
      {activeTab === 'Content Pipeline' && (
        <div className="space-y-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Content Pipeline</h1>
            <p className="text-sm text-slate-500 mt-1">Staging drafts queue, outlines planner, and publishing center.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Plan Content Outline Form */}
            <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Outline Planner
              </h3>
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target SEO Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g., Node.js memory leaks..."
                    value={planKeyword}
                    onChange={(e) => setPlanKeyword(e.target.value)}
                    disabled={loadingStates.planContent}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!planKeyword.trim() || loadingStates.planContent}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loadingStates.planContent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Outline...
                    </>
                  ) : (
                    'Run SEO Content Planner'
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Queue Staging Board */}
            <div className="lg:col-span-2 bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Queue Staging Board ({drafts.length})
              </h3>

              <div className="space-y-4">
                {drafts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No content in queue. Plan a keyword to begin.</div>
                ) : (
                  drafts.map((draft) => (
                    <div key={draft.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                      <div className="space-y-1">
                        <h4 
                          onClick={() => setSelectedDraft(draft)}
                          className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer text-sm"
                        >
                          {draft.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                            {draft.target_keyword}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500">• {formatDate(draft.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDraft(draft)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        {draft.status === 'draft' ? (
                          <button
                            onClick={() => handlePublish(draft.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Publish
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                            Published ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Tab */}
      {activeTab === 'AI Chat' && (
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Consultant Chat
              </h3>
              <p className="text-[11px] text-slate-400">Contextual multi-turn advice grounded in current technical audit and performance data.</p>
            </div>
            {chatSessionId && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                Session: {chatSessionId}
              </span>
            )}
          </div>

          {/* Conversations body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-900/5">
            {chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                  chat.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                }`}>
                  {chat.role === 'user' ? 'ME' : 'AI'}
                </div>
                {/* message box */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  chat.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                }`}>
                  <p>{chat.content}</p>
                </div>
              </div>
            ))}
            {loadingStates.chat && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  AI
                </div>
                <div className="p-4 rounded-2xl text-sm bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Claude is analyzing site data...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleChatSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loadingStates.chat}
              placeholder="Ask for recommendations on optimizing underperforming pages..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || loadingStates.chat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Placeholder Tabs */}
      {['Keyword Engine', 'Site Audits', 'Link Building', 'GSC Analytics'].includes(activeTab) && (
        <div className="max-w-4xl mx-auto text-center py-20 bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeTab} Panel</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The {activeTab} engine is running automated recurring background cron jobs. Click on "Overview" to see recent activity logs.
          </p>
        </div>
      )}

      {/* Rendered Preview Overlay Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setSelectedDraft(null)}>
          <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{selectedDraft.title}</h2>
              <button 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold p-1"
                onClick={() => setSelectedDraft(null)}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <strong>Original Keyword:</strong> <span className="text-indigo-500 font-semibold">{selectedDraft.target_keyword}</span>
                </div>
                <div>
                  <strong>URL Slug:</strong> <span className="text-purple-500">/blog/{selectedDraft.slug}</span>
                </div>
                <div>
                  <strong>Status:</strong> <span className={`font-semibold ${selectedDraft.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {selectedDraft.status === 'published' ? 'Published Live' : 'Draft Staged'}
                  </span>
                </div>
                {selectedDraft.status === 'published' && (
                  <div>
                    <strong>Public URL:</strong> <a href={`#/blog/${selectedDraft.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                      /blog/{selectedDraft.slug}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="markdown-preview prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 leading-relaxed text-sm">
                <ReactMarkdown>{selectedDraft.markdown_body}</ReactMarkdown>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/10">
              <button 
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer"
                onClick={() => setSelectedDraft(null)}
              >
                Close
              </button>
              {selectedDraft.status === 'draft' && (
                <button 
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer" 
                  onClick={() => handlePublish(selectedDraft.id)}
                >
                  Publish Live
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
