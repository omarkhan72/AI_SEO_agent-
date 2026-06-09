import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Search, 
  Link2, 
  CheckSquare, 
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  Info,
  ChevronRight
} from 'lucide-react';
import { useAgentAPI } from '../hooks/useAgentAPI.js';

export default function Overview({ activeDomain }) {
  const { loadingStates, planContent, runSiteAudit, trackPerformance } = useAgentAPI();
  
  const [siteHealth, setSiteHealth] = useState(82);
  const [trafficForecast, setTrafficForecast] = useState("+32.4%");
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, message: "Monday Content Planner Completed: Generated 30-day drafts calendar", time: "2 hours ago", type: "success" },
    { id: 2, message: "Sunday Health Check: Technical site audit completed successfully", time: "1 day ago", type: "info" },
    { id: 3, message: "Weekly News Fetcher: google_global_updates refreshed", time: "3 days ago", type: "info" },
    { id: 4, message: "Win Logger: Keyword 'React Native optimization' rank improved to #3", time: "4 days ago", type: "win" }
  ]);

  const handleQuickAudit = async () => {
    try {
      const result = await runSiteAudit(activeDomain);
      if (result && result.data) {
        const scores = result.data.dimension_scores;
        const average = Math.round(
          (scores.technical + scores.on_page + scores.off_page + scores.content_quality + scores.mobile_ux + scores.eeat) / 6
        );
        setSiteHealth(average);
        
        const newLog = {
          id: Date.now(),
          message: `SEO Audit Completed: Domain "${activeDomain}" health score updated to ${average}%`,
          time: "Just now",
          type: "success"
        };
        setRecentActivities(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickPlan = async () => {
    const topic = window.prompt("Enter a keyword seed topic to plan content outline:", "Next.js App Router performance");
    if (!topic) return;
    try {
      const result = await planContent(topic);
      if (result) {
        const newLog = {
          id: Date.now(),
          message: `Content Planner outline generated for topic: "${topic}"`,
          time: "Just now",
          type: "success"
        };
        setRecentActivities(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickTrack = async () => {
    try {
      const result = await trackPerformance("decayed-doc");
      if (result) {
        const newLog = {
          id: Date.now(),
          message: `Rank Tracker: Keyword "${result.keyword}" checked. Position: #${result.current_position}.`,
          time: "Just now",
          type: result.is_win ? "win" : "info"
        };
        setRecentActivities(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Page Heading & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            Performance Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Central orchestration node for domain <span className="font-semibold text-purple-600 dark:text-purple-400 underline decoration-purple-500/30 underline-offset-4">{activeDomain}</span>.
          </p>
        </div>
      </div>

      {/* 2026 F-Pattern Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Area (F-Pattern Primary) - Hero KPI Metric Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KPI Card 1: Site Health Score (Hero) */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-56 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/35 hover:shadow-xl dark:hover:shadow-purple-500/5 group">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Overall Site Health
                  </p>
                  <h3 className="text-6xl font-black mt-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
                    {siteHealth}%
                  </h3>
                </div>
                <span className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </span>
              </div>

              {/* Sparkline Graphic - Custom SVG */}
              <div className="w-full h-12 mt-2 z-10 relative">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad-health" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,15 L20,13 L40,16 L60,11 L80,12 L100,5 L100,20 L0,20 Z" fill="url(#grad-health)" />
                  <path d="M0,15 L20,13 L40,16 L60,11 L80,12 L100,5" fill="none" stroke="#10b981" strokeWidth="1.2" />
                  <circle cx="20" cy="13" r="1" fill="#10b981" />
                  <circle cx="40" cy="16" r="1" fill="#10b981" />
                  <circle cx="60" cy="11" r="1" fill="#10b981" />
                  <circle cx="80" cy="12" r="1" fill="#10b981" />
                  <circle cx="100" cy="5" r="1" fill="#10b981" />
                </svg>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 z-10 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google core updates compliant</span>
              </div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
            </div>

            {/* KPI Card 2: Traffic Forecast (Hero) */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-56 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/35 hover:shadow-xl dark:hover:shadow-purple-500/5 group">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    30-Day Traffic Forecast
                  </p>
                  <h3 className="text-6xl font-black mt-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-400">
                    {trafficForecast}
                  </h3>
                </div>
                <span className="p-3 bg-purple-500/10 dark:bg-purple-500/5 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </span>
              </div>

              {/* Sparkline Graphic - Custom SVG */}
              <div className="w-full h-12 mt-2 z-10 relative">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad-traffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#c084fc" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,18 L25,15 L50,11 L75,12 L100,3 L100,20 L0,20 Z" fill="url(#grad-traffic)" />
                  <path d="M0,18 L25,15 L50,11 L75,12 L100,3" fill="none" stroke="#c084fc" strokeWidth="1.2" />
                  <circle cx="25" cy="15" r="1" fill="#c084fc" />
                  <circle cx="50" cy="11" r="1" fill="#c084fc" />
                  <circle cx="75" cy="12" r="1" fill="#c084fc" />
                  <circle cx="100" cy="3" r="1" fill="#c084fc" />
                </svg>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 z-10 mt-2">
                <Info className="w-4 h-4 text-purple-500 animate-pulse" />
                <span>Growth driven by keyword clustering</span>
              </div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-purple-500/5 rounded-full blur-xl" />
            </div>

          </div>

          {/* Quick Action Center */}
          <div className="glass-panel rounded-3xl p-8 space-y-6 relative overflow-hidden">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-purple-500 animate-pulse" />
                Action Operations Center
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Dispatch automated optimization crawlers, plan outlines blueprints, and query live Search Console metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Action 1: Run SEO Audit */}
              <button 
                onClick={handleQuickAudit}
                disabled={loadingStates.siteAudit}
                className="glow-btn-amethyst flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-purple-500/20 text-slate-700 dark:text-slate-300 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl text-emerald-500 group-hover:scale-115 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-center group-hover:text-purple-400 transition-colors">
                  {loadingStates.siteAudit ? 'Auditing...' : 'Run SEO Audit'}
                </span>
              </button>

              {/* Action 2: Plan New Article */}
              <button 
                onClick={handleQuickPlan}
                disabled={loadingStates.planContent}
                className="glow-btn-amethyst flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-purple-500/20 text-slate-700 dark:text-slate-300 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="p-3 bg-purple-500/10 dark:bg-purple-500/5 rounded-xl text-purple-400 group-hover:scale-115 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-center group-hover:text-purple-400 transition-colors">
                  {loadingStates.planContent ? 'Planning...' : 'Plan New Article'}
                </span>
              </button>

              {/* Action 3: Track Rank Position */}
              <button 
                onClick={handleQuickTrack}
                disabled={loadingStates.trackPerformance}
                className="glow-btn-amethyst flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-purple-500/20 text-slate-700 dark:text-slate-300 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="p-3 bg-pink-500/10 dark:bg-pink-500/5 rounded-xl text-pink-400 group-hover:scale-115 transition-transform">
                  <Search className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-center group-hover:text-purple-400 transition-colors">
                  {loadingStates.trackPerformance ? 'Tracking...' : 'Track Rank'}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* Right Area (F-Pattern Secondary) - AI Activity Vertical Timeline */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col h-[33rem]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-purple-500" />
            AI Operations Log
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-6">
            Chronological log of platform background tasks and agent schedules.
          </p>

          {/* Timeline Feed Container */}
          <div className="flex-1 overflow-y-auto pr-1 relative pl-4 border-l border-slate-200 dark:border-purple-500/15 space-y-6">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative group">
                
                {/* Custom timeline node bullet */}
                <span className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-950 flex-shrink-0 z-10 transition-transform group-hover:scale-110 ${
                  act.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                  act.type === 'win' ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]' : 
                  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                }`} />

                <div className="space-y-1 pl-2.5">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-350 leading-relaxed group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                    {act.message}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
