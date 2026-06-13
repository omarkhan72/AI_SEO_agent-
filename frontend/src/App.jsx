import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Toaster } from 'react-hot-toast';
import { 
  FileText, 
  Sparkles, 
  Eye, 
  Send, 
  Loader2,
  CheckCircle,
  Compass
} from 'lucide-react';

import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Overview from './pages/Overview.jsx';
import GscAnalytics from './pages/GscAnalytics.jsx';
import KeywordEngine from './pages/KeywordEngine.jsx';
import SiteAudits from './pages/SiteAudits.jsx';
import LinkBuilding from './pages/LinkBuilding.jsx';
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
          markdown_body: `## Outline Blueprint\n\nGenerated outline for **${planKeyword.trim()}**:\n\n${outline.headings.map(h => `* ${h}`).join('\n')}\n\n*Draft is ready for composition!*`
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
      <Toaster 
        position="bottom-right" 
        reverseOrder={false}
        toastOptions={{
          className: 'bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl text-xs font-semibold p-4'
        }}
      />

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <Overview activeDomain={activeDomain} />
      )}

      {/* GSC Analytics Tab */}
      {activeTab === 'GSC Analytics' && (
        <GscAnalytics activeDomain={activeDomain} onBack={() => setActiveTab('Overview')} />
      )}

      {/* Keyword Engine Tab */}
      {activeTab === 'Keyword Engine' && (
        <KeywordEngine activeDomain={activeDomain} onBack={() => setActiveTab('Overview')} />
      )}

      {/* Site Audits Tab */}
      {activeTab === 'Site Audits' && (
        <SiteAudits activeDomain={activeDomain} onBack={() => setActiveTab('Overview')} />
      )}

      {/* Link Building Tab */}
      {activeTab === 'Link Building' && (
        <LinkBuilding activeDomain={activeDomain} onBack={() => setActiveTab('Overview')} />
      )}

      {/* Content Pipeline Tab */}
      {activeTab === 'Content Pipeline' && (
        <div className="space-y-10 max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Content Pipeline</h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">Staging drafts queue, outlines planner, and publishing center.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Plan Content Outline Form */}
            <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm h-fit">
              <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Outline Planner
              </h3>
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Target Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g., React performance tuning..."
                    value={planKeyword}
                    onChange={(e) => setPlanKeyword(e.target.value)}
                    disabled={loadingStates.planContent}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 text-xs font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!planKeyword.trim() || loadingStates.planContent}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
                >
                  {loadingStates.planContent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Planning Outline...
                    </>
                  ) : (
                    'Generate Outline'
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Queue Staging Board */}
            <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Queue Staging Board ({drafts.length})
              </h3>

              <div className="space-y-3">
                {drafts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium">No content in queue. Plan a keyword to begin.</div>
                ) : (
                  drafts.map((draft) => (
                    <div key={draft.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 bg-white gap-4 hover:border-gray-300 hover:shadow-xs transition-all">
                      <div className="space-y-1">
                        <h4 
                          onClick={() => setSelectedDraft(draft)}
                          className="font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer text-xs transition-colors"
                        >
                          {draft.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-400">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider border border-gray-200">
                            {draft.target_keyword}
                          </span>
                          <span className="font-mono">{formatDate(draft.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDraft(draft)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-gray-700 bg-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        {draft.status === 'draft' ? (
                          <button
                            onClick={() => handlePublish(draft.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Publish
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold bg-emerald-50/40">
                            Published Live ✓
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
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI SEO Advisor Desk
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Real-time consultant grounded in site technical audits and position performance.</p>
            </div>
            {chatSessionId && (
              <span className="text-[9px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md border border-gray-200 font-mono">
                SESSION: {chatSessionId}
              </span>
            )}
          </div>

          {/* Conversations body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
            {chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* avatar */}
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-extrabold text-[9px] border ${
                  chat.role === 'user' 
                    ? 'bg-gray-150 text-gray-800 border-gray-300' 
                    : 'bg-gray-900 text-white border-gray-900 shadow-sm'
                }`}>
                  {chat.role === 'user' ? 'ME' : 'AI'}
                </div>
                {/* message box */}
                <div className={`p-4 rounded-xl text-xs leading-relaxed font-medium ${
                  chat.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-xs'
                }`}>
                  <p>{chat.content}</p>
                </div>
              </div>
            ))}
            {loadingStates.chat && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-gray-900 text-white font-extrabold text-[9px] flex items-center justify-center border border-gray-900">
                  AI
                </div>
                <div className="p-4 rounded-xl text-xs bg-white text-gray-400 border border-gray-200 rounded-tl-none flex items-center gap-2 font-medium shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Advisor is analyzing site data...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleChatSend} className="p-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loadingStates.chat}
              placeholder="Ask for recommendations on optimizing underperforming pages..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 text-xs font-medium"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || loadingStates.chat}
              className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Placeholder Tabs */}
      {[].includes(activeTab) && (
        <div className="max-w-xl mx-auto text-center py-16 bg-white border border-gray-200 p-8 rounded-xl shadow-sm space-y-5">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mx-auto border border-gray-200">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">{activeTab} Dashboard</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed font-medium">
              The {activeTab} engine is running automated recurring background cron jobs in the system scheduler.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('Overview')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-xs"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Rendered Preview Overlay Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setSelectedDraft(null)}>
          <div className="bg-white border border-gray-200 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 leading-tight">{selectedDraft.title}</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 cursor-pointer"
                onClick={() => setSelectedDraft(null)}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-[11px] font-medium text-gray-500 leading-relaxed shadow-inner">
                <div>
                  <strong>Original Keyword:</strong> <span className="text-indigo-600 font-semibold">{selectedDraft.target_keyword}</span>
                </div>
                <div>
                  <strong>URL Slug:</strong> <span className="text-gray-750">/blog/{selectedDraft.slug}</span>
                </div>
                <div>
                  <strong>Status:</strong> <span className={`font-bold uppercase tracking-wider text-[9px] ${selectedDraft.status === 'published' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {selectedDraft.status === 'published' ? 'Published Live' : 'Draft Staged'}
                  </span>
                </div>
                {selectedDraft.status === 'published' && (
                  <div>
                    <strong>Public URL:</strong> <a href={`#/blog/${selectedDraft.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-650 underline font-semibold">
                      /blog/{selectedDraft.slug}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="markdown-preview prose prose-slate max-w-none text-gray-700 leading-relaxed text-xs font-medium border-t border-gray-150 pt-6">
                <ReactMarkdown>{selectedDraft.markdown_body}</ReactMarkdown>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50/50">
              <button 
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold cursor-pointer bg-white"
                onClick={() => setSelectedDraft(null)}
              >
                Close
              </button>
              {selectedDraft.status === 'draft' && (
                <button 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer" 
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
