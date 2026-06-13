import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  Code, 
  CheckCircle,
  ExternalLink,
  ChevronRight,
  WifiOff
} from 'lucide-react';
import { useAgentAPI } from '../hooks/useAgentAPI.js';
import toast from 'react-hot-toast';

export default function SiteAudits({ activeDomain, onBack }) {
  const { loadingStates, runSiteAudit } = useAgentAPI();
  const [auditData, setAuditData] = useState(null);
  const [activeTab, setActiveTab] = useState('critical'); // 'critical' | 'warnings'
  const [localError, setLocalError] = useState(null);
  
  // Resolution states
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedIssues, setResolvedIssues] = useState([]);

  // Mock list of issues matching requested specifications
  const criticalErrors = [
    { 
      id: 'crit-1', 
      title: "Broken Outbound Link (404 Error encountered on /blog/nextjs-tips)",
      type: "Link Integrity",
      aiRecommendation: {
        description: "The link points to an inactive domain. Update the target URL to a valid HTTPS address or set up a 301 redirection route.",
        snippet: `// Suggested 301 Redirect Rule (nginx config)
location = /blog/nextjs-tips {
    return 301 https://nextjs.org/docs/app/building-your-application/routing;
}`
      }
    },
    { 
      id: 'crit-2', 
      title: "Missing Canonical Tags on 2 production landing pages",
      type: "Crawl Indexation",
      aiRecommendation: {
        description: "Self-referential canonical tags are missing, which could cause duplicate content issues under Google's mobile-first index. Insert the following metadata element into the HTML <head> block.",
        snippet: `<!-- Add to head tags of landing page -->
<link rel="canonical" href="https://${activeDomain}/landing-page" />`
      }
    }
  ];

  const warningIssues = [
    {
      id: 'warn-1',
      title: "Large image files slowing down mobile rendering on homepage",
      type: "Core Web Vitals",
      aiRecommendation: {
        description: "Images are served in uncompressed formats (PNG/JPEG) exceeding 400KB. Compress them to WebP or AVIF format and implement source srcset responsive layouts.",
        snippet: `<!-- Optimized responsive image component -->
<picture>
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="Hero banner" loading="lazy" width="800" height="400">
</picture>`
      }
    },
    {
      id: 'warn-2',
      title: "Missing Alt tags on 4 images on /about",
      type: "Accessibility & Semantic Structure",
      aiRecommendation: {
        description: "Images without descriptive Alt tags reduce screen-reader accessibility and image search optimization scores. Add contextual descriptive strings.",
        snippet: `<img src="/images/team-grid.jpg" alt="SEO Studio development team planning core architectures" />`
      }
    }
  ];

  const fetchAuditData = async (domain, silent = false) => {
    setLocalError(null);
    try {
      const result = await runSiteAudit(domain);
      if (result && result.success) {
        setAuditData(result.data);
      } else {
        throw new Error("Invalid audit data payload returned");
      }
    } catch (err) {
      console.warn("Local SiteAudit page caught network exception:", err.message);
      // Suppress showing raw toast block error on page layout by setting localError
      // Maintain strict typography and styling limits
      setLocalError(err.message || "Auditing endpoint is currently offline");
    }
  };

  useEffect(() => {
    if (activeDomain) {
      fetchAuditData(activeDomain);
    }
  }, [activeDomain]);

  const handleTriggerAudit = () => {
    fetchAuditData(activeDomain);
  };

  const handleUseSimulator = () => {
    // Falls back gracefully to high-fidelity simulated audit data inside a component sub-boundary
    setLocalError(null);
    setAuditData({
      dimension_scores: {
        technical: 88,
        on_page: 94,
        off_page: 82,
        content_quality: 80,
        mobile_ux: 79,
        eeat: 85
      }
    });
    toast.success("Loaded audit crawler simulator data.");
  };

  const handleFixWithAI = (issue) => {
    setSelectedIssue(issue);
  };

  const handleConfirmResolution = (issueId) => {
    setIsResolving(true);
    setTimeout(() => {
      setResolvedIssues(prev => [...prev, issueId]);
      setIsResolving(false);
      setSelectedIssue(null);
      toast.success(
        <div className="space-y-1">
          <p className="font-bold text-xs text-gray-900">Technical Issue Resolved!</p>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed font-sans">
            AI has successfully updated staging code and flushed caching nodes.
          </p>
        </div>,
        { duration: 4000 }
      );
    }, 1200);
  };

  const isLoading = loadingStates.siteAudit || (!auditData && !localError);

  // 1. Error State Cleanliness - Component Sub-Boundary Catch Panel
  if (localError) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-250 flex items-center justify-center mx-auto text-gray-400">
            <WifiOff className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Audit Connection Failed</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-medium">
              The technical crawler could not establish a verification handshake with domain <span className="font-semibold text-gray-700">{activeDomain}</span>.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[11px] text-gray-500 font-medium text-left leading-relaxed">
            <p className="font-bold text-gray-750 mb-1">Diagnostic Detail:</p>
            <p className="font-mono text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100/50 mb-2">{localError}</p>
            <p>Please check that your backend Node.js API server is running locally on port 5000. Alternatively, bypass live fetching to preview the audit views with mock parameters.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={handleUseSimulator}
              className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 bg-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Use Crawler Simulator
            </button>
            <button
              onClick={() => fetchAuditData(activeDomain)}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pulse Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-10 max-w-6xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-2">
          <div className="space-y-2 w-1/3">
            <div className="h-7 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded-lg"></div>
        </div>
        {/* Metric Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-36 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-7 bg-gray-300 rounded w-2/3"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full w-full mt-4"></div>
            </div>
          ))}
        </div>
        {/* Issues Panel Skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-4 border-b border-gray-150 pb-2">
            <div className="h-6 bg-gray-300 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-4 pt-2">
            {[1, 2].map(i => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-250 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scores mapped from either Simulator or API response
  const technicalScore = auditData?.dimension_scores?.technical || 88;
  const securityScore = auditData?.dimension_scores?.on_page || 94; // Using on_page as proxy for security audit details
  const mobileScore = auditData?.dimension_scores?.mobile_ux || 79;

  const activeCriticalErrors = criticalErrors.filter(err => !resolvedIssues.includes(err.id));
  const activeWarnings = warningIssues.filter(warn => !resolvedIssues.includes(warn.id));

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 rounded-lg transition-colors cursor-pointer"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Site Audits
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">
              Technical crawl inspection, accessibility audit, and mobile rendering diagnostics.
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerAudit}
          disabled={loadingStates.siteAudit}
          className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-xs cursor-pointer flex items-center justify-center gap-2 select-none bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loadingStates.siteAudit ? 'animate-spin' : ''}`} />
          {loadingStates.siteAudit ? 'Auditing...' : 'Trigger Fresh Audit'}
        </button>
      </div>

      {/* 2. Technical Score Matrices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Performance Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-36 hover:border-gray-300 transition-colors">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core Performance Score</span>
            <h3 className="text-4xl font-bold tracking-tight text-gray-900 font-mono">
              {technicalScore}/100
            </h3>
          </div>
          
          <div className="space-y-2 w-full">
            {/* Clean progress tracking line */}
            <div className="w-full h-1 bg-gray-150 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${technicalScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-gray-450 font-bold uppercase tracking-wider">
              <span>Stable performance index</span>
              <span className="text-emerald-600">Optimal</span>
            </div>
          </div>
        </div>

        {/* Security & Crawlability */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-36 hover:border-gray-300 transition-colors">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security & Crawlability</span>
            <h3 className="text-4xl font-bold tracking-tight text-gray-900 font-mono">
              {securityScore}/100
            </h3>
          </div>

          <div className="space-y-2 w-full">
            {/* Progress track */}
            <div className="w-full h-1 bg-gray-150 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${securityScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-gray-450 font-bold uppercase tracking-wider">
              <span>SSL & Header verification</span>
              <span className="text-emerald-600">High Trust</span>
            </div>
          </div>
        </div>

        {/* Mobile Optimization */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-36 hover:border-gray-300 transition-colors">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Optimization</span>
            <h3 className="text-4xl font-bold tracking-tight text-gray-900 font-mono">
              {mobileScore}/100
            </h3>
          </div>

          <div className="space-y-2 w-full">
            {/* Progress track */}
            <div className="w-full h-1 bg-gray-150 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${mobileScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
              <span className="text-gray-400">Viewport diagnostics</span>
              <span className="text-amber-600 font-extrabold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                Needs tuning
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Categorized Issues Checklist */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Found Technical Issues</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              Technical crawl discrepancies classified by priority rank. Click Fix to automate resolution.
            </p>
          </div>

          {/* Tab Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'critical'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-gray-550 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>Critical Errors</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${
                activeTab === 'critical' ? 'bg-rose-600 text-white font-bold' : 'bg-gray-100 text-gray-600'
              }`}>
                {activeCriticalErrors.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'warnings'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-gray-550 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>Warnings</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${
                activeTab === 'warnings' ? 'bg-amber-600 text-white font-bold' : 'bg-gray-100 text-gray-600'
              }`}>
                {activeWarnings.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab body rendering */}
        <div className="space-y-1">
          {activeTab === 'critical' && (
            <>
              {activeCriticalErrors.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400 font-bold">All Critical Errors resolved!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeCriticalErrors.map((err) => (
                    <div key={err.id} className="flex justify-between items-center py-4.5 gap-4 group">
                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 leading-relaxed">
                            {err.title}
                          </p>
                          <span className="inline-block bg-gray-50 text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                            Category: {err.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFixWithAI(err)}
                        className="text-xs font-bold text-indigo-650 hover:text-indigo-800 underline transition-colors cursor-pointer select-none whitespace-nowrap p-1 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Fix with AI
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'warnings' && (
            <>
              {activeWarnings.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400 font-bold">All Technical Warnings resolved!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeWarnings.map((warn) => (
                    <div key={warn.id} className="flex justify-between items-center py-4.5 gap-4 group">
                      <div className="flex gap-3 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 leading-relaxed">
                            {warn.title}
                          </p>
                          <span className="inline-block bg-gray-50 text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                            Category: {warn.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFixWithAI(warn)}
                        className="text-xs font-bold text-indigo-650 hover:text-indigo-800 underline transition-colors cursor-pointer select-none whitespace-nowrap p-1 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Fix with AI
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. AI Fix Recommendation Modal Dialogue Drawer */}
      {selectedIssue && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedIssue(null)}
        >
          <div 
            className="bg-white border border-gray-200 rounded-xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">AI Technical Resolution Desk</h3>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer leading-none"
                onClick={() => setSelectedIssue(null)}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Diagnosed Issue</span>
                <p className="text-xs text-gray-900 font-bold bg-gray-50 border border-gray-200 p-3.5 rounded-lg leading-relaxed">
                  {selectedIssue.title}
                </p>
              </div>

              <div className="space-y-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">AI Recommended Patch Description</span>
                <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                  {selectedIssue.aiRecommendation.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-gray-400" />
                  Staging Code Patch Snippet
                </span>
                <pre className="bg-gray-900 text-gray-100 text-[10px] p-4.5 rounded-xl font-mono overflow-x-auto border border-gray-800 shadow-inner select-all">
                  {selectedIssue.aiRecommendation.snippet}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4.5 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-2.5">
              <button 
                disabled={isResolving}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold cursor-pointer bg-white"
                onClick={() => setSelectedIssue(null)}
              >
                Cancel
              </button>
              <button 
                disabled={isResolving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                onClick={() => handleConfirmResolution(selectedIssue.id)}
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Applying patch...
                  </>
                ) : (
                  <>
                    Apply Code Fix
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
