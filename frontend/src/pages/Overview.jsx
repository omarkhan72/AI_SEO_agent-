import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Search, 
  FileText, 
  CheckSquare, 
  Zap,
  Globe
} from 'lucide-react';
import { useAgentAPI } from '../hooks/useAgentAPI.js';

export default function Overview({ activeDomain }) {
  const { loadingStates, planContent, runSiteAudit, trackPerformance } = useAgentAPI();
  
  const [siteHealth, setSiteHealth] = useState(82);
  const [trafficForecast, setTrafficForecast] = useState("+32.4%");
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, message: "Monday Content Planner Completed: Generated 30-day drafts calendar", time: "2 hours ago" },
    { id: 2, message: "Sunday Health Check: Technical site audit completed successfully", time: "1 day ago" },
    { id: 3, message: "Weekly News Fetcher: google_global_updates refreshed", time: "3 days ago" },
    { id: 4, message: "Win Logger: Keyword 'React Native optimization' rank improved to #3", time: "4 days ago" }
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
          time: "Just now"
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
          time: "Just now"
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
          time: "Just now"
        };
        setRecentActivities(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 font-medium">
          Analytics dashboard and background agent operations for <span className="font-semibold text-indigo-600">{activeDomain}</span>.
        </p>
      </div>

      {/* 2026 F-Pattern Layout Grid - Stark Light Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (F-Pattern Primary) - Metric Panels */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Health Metric Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col justify-between h-52 relative">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Site Health Score
                  </p>
                  <h3 className="text-5xl font-semibold tracking-tighter text-gray-900 mt-2">
                    {siteHealth}%
                  </h3>
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>

              {/* Minimal Line Chart SVG (Stripe/Linear style) */}
              <div className="w-full h-10 mt-2">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,15 L20,13 L40,16 L60,11 L80,12 L100,5" fill="none" stroke="#4f46e5" strokeWidth="1.2" />
                  <circle cx="20" cy="13" r="1" fill="#4f46e5" />
                  <circle cx="40" cy="16" r="1" fill="#4f46e5" />
                  <circle cx="60" cy="11" r="1" fill="#4f46e5" />
                  <circle cx="80" cy="12" r="1" fill="#4f46e5" />
                  <circle cx="100" cy="5" r="1" fill="#4f46e5" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Optimized content compliance</span>
              </div>
            </div>

            {/* Traffic Forecast Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col justify-between h-52 relative">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    30-Day Traffic Forecast
                  </p>
                  <h3 className="text-5xl font-semibold tracking-tighter text-gray-900 mt-2">
                    {trafficForecast}
                  </h3>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>

              {/* Minimal Line Chart SVG (Stripe/Linear style) */}
              <div className="w-full h-10 mt-2">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,18 L25,15 L50,11 L75,12 L100,3" fill="none" stroke="#4f46e5" strokeWidth="1.2" />
                  <circle cx="25" cy="15" r="1" fill="#4f46e5" />
                  <circle cx="50" cy="11" r="1" fill="#4f46e5" />
                  <circle cx="75" cy="12" r="1" fill="#4f46e5" />
                  <circle cx="100" cy="3" r="1" fill="#4f46e5" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Positive ranking trajectory</span>
              </div>
            </div>

          </div>

          {/* Quick Action Center */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Action Desk
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Dispatch crawlers, plan outline blueprints, and track active keywords position.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Action 1: Run SEO Audit */}
              <button 
                onClick={handleQuickAudit}
                disabled={loadingStates.siteAudit}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-800 transition-all cursor-pointer disabled:opacity-50 select-none group shadow-xs"
              >
                <CheckSquare className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-xs font-bold tracking-tight text-gray-700">
                  {loadingStates.siteAudit ? 'Auditing...' : 'Run SEO Audit'}
                </span>
              </button>

              {/* Action 2: Plan New Article */}
              <button 
                onClick={handleQuickPlan}
                disabled={loadingStates.planContent}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-800 transition-all cursor-pointer disabled:opacity-50 select-none group shadow-xs"
              >
                <FileText className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-xs font-bold tracking-tight text-gray-700">
                  {loadingStates.planContent ? 'Planning...' : 'Plan Article'}
                </span>
              </button>

              {/* Action 3: Track Rank Position */}
              <button 
                onClick={handleQuickTrack}
                disabled={loadingStates.trackPerformance}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-800 transition-all cursor-pointer disabled:opacity-50 select-none group shadow-xs"
              >
                <Search className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-xs font-bold tracking-tight text-gray-700">
                  {loadingStates.trackPerformance ? 'Tracking...' : 'Track Rank'}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* Right Column (F-Pattern Secondary) - Monochrome Timeline Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm h-[31rem] flex flex-col">
          <h2 className="text-base font-bold text-gray-900">
            System Operations Log
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6 font-medium">
            Chronological registry of automated task updates.
          </p>

          {/* Timeline Feed Container */}
          <div className="flex-1 overflow-y-auto pr-1 pl-3 border-l border-gray-100 space-y-6 relative">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative group">
                
                {/* Tiny Monochrome Dot */}
                <span className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-200 border-2 border-white flex-shrink-0 z-10 group-hover:bg-gray-400 transition-colors" />

                <div className="space-y-1 pl-2.5">
                  <p className="text-xs font-medium text-gray-650 leading-relaxed group-hover:text-gray-900 transition-colors">
                    {act.message}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 font-mono tracking-wide">
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
