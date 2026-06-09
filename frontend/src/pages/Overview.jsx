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
  Globe
} from 'lucide-react';
import { useAgentAPI } from '../hooks/useAgentAPI.js';

export default function Overview({ activeDomain }) {
  const { loadingStates, planContent, runSiteAudit, trackPerformance } = useAgentAPI();
  
  // Local state for statistics and activity logs
  const [siteHealth, setSiteHealth] = useState(82);
  const [trafficForecast, setTrafficForecast] = useState("+32.4%");
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, message: "Monday Content Planner Completed: Generated 30-day drafts calendar", time: "2 hours ago", type: "success" },
    { id: 2, message: "Sunday Health Check: Technical site audit completed successfully", time: "1 day ago", type: "info" },
    { id: 3, message: "Weekly News Fetcher: google_global_updates refreshed", time: "3 days ago", type: "info" },
    { id: 4, message: "Win Logger: Keyword 'React Native optimization' rank improved to #3", time: "4 days ago", type: "win" }
  ]);

  // Quick Action: Run SEO Audit
  const handleQuickAudit = async () => {
    try {
      const result = await runSiteAudit(activeDomain);
      if (result && result.data) {
        const scores = result.data.dimension_scores;
        // Compute average score
        const average = Math.round(
          (scores.technical + scores.on_page + scores.off_page + scores.content_quality + scores.mobile_ux + scores.eeat) / 6
        );
        setSiteHealth(average);
        
        // Add activity entry
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

  // Quick Action: Plan New Article Outline
  const handleQuickPlan = async () => {
    const topic = window.prompt("Enter a keyword seed topic to plan content outline:", "Next.js App Router performance");
    if (!topic) return;
    try {
      const result = await planContent(topic);
      if (result) {
        // Add activity entry
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

  // Quick Action: Run Keyword Position Tracker Check
  const handleQuickTrack = async () => {
    try {
      const result = await trackPerformance("decayed-doc");
      if (result) {
        // Add activity entry
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            Workspace Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyzing search performance, site architecture audits, and automated content scheduling for <span className="font-semibold text-indigo-500">{activeDomain}</span>.
          </p>
        </div>
      </div>

      {/* 2026 F-Pattern Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Hero KPI Metrics (F-Pattern Primary Area) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* KPI 1: Site Health Score (Hero Card) */}
            <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Site Health Score
                  </p>
                  <h3 className="text-5xl font-black text-slate-800 dark:text-white mt-3">
                    {siteHealth}%
                  </h3>
                </div>
                <span className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Activity className="w-6 h-6" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium z-10">
                <span>Excellent alignment</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">Google core updates compliant</span>
              </div>
              {/* background vector highlights */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            </div>

            {/* KPI 2: Traffic Forecast (Hero Card) */}
            <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    30-Day Traffic Forecast
                  </p>
                  <h3 className="text-5xl font-black text-slate-800 dark:text-white mt-3">
                    {trafficForecast}
                  </h3>
                </div>
                <span className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                  <TrendingUp className="w-6 h-6" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium z-10">
                <span>Predicted growth path</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="text-slate-400">Based on Pillar/Cluster optimization</span>
              </div>
              {/* background vector highlights */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              Quick Action Center
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Instantly run background crawlers, trigger content planning engines, and track rankings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Action 1: Run SEO Audit */}
              <button 
                onClick={handleQuickAudit}
                disabled={loadingStates.siteAudit}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group disabled:opacity-50"
              >
                <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-center">
                  {loadingStates.siteAudit ? 'Running Audit...' : 'Run SEO Audit'}
                </span>
              </button>

              {/* Action 2: Plan New Article */}
              <button 
                onClick={handleQuickPlan}
                disabled={loadingStates.planContent}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group disabled:opacity-50"
              >
                <span className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-center">
                  {loadingStates.planContent ? 'Planning...' : 'Plan New Article'}
                </span>
              </button>

              {/* Action 3: Track Rank Position */}
              <button 
                onClick={handleQuickTrack}
                disabled={loadingStates.trackPerformance}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group disabled:opacity-50"
              >
                <span className="p-2 bg-pink-500/10 rounded-lg text-pink-500 group-hover:scale-110 transition-transform">
                  <Search className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-center">
                  {loadingStates.trackPerformance ? 'Tracking...' : 'Track Rank Position'}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* Right Column: AI Background Activity Feed */}
        <div className="bg-lightPanel dark:bg-darkPanel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            AI background Activity Feed
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Real-time logs of platform background cron jobs and agent triggers.
          </p>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div 
                key={act.id} 
                className="flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-b-0 last:pb-0"
              >
                {/* indicator dot */}
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  act.type === 'success' ? 'bg-emerald-500' :
                  act.type === 'win' ? 'bg-pink-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    {act.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
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
