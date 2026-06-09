import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Key, 
  CheckSquare, 
  Link2, 
  LineChart, 
  MessageSquare, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight,
  Globe 
} from 'lucide-react';

const DOMAINS = ['example.com', 'techventures.io', 'saasgrowth.org'];

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  activeDomain, 
  setActiveDomain 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Synchronize dark class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Content Pipeline', label: 'Content Pipeline', icon: FileText },
    { id: 'Keyword Engine', label: 'Keyword Engine', icon: Key },
    { id: 'Site Audits', label: 'Site Audits', icon: CheckSquare },
    { id: 'Link Building', label: 'Link Building', icon: Link2 },
    { id: 'GSC Analytics', label: 'GSC Analytics', icon: LineChart },
    { id: 'AI Chat', label: 'AI Chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-lightBg dark:bg-darkBg text-slate-700 dark:text-slate-200 flex transition-colors duration-300 mesh-bg">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900/95 dark:bg-slate-950/98 border-r border-slate-200/60 dark:border-purple-500/15 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header - Polished Metal Badge */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-purple-500/15">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200 text-slate-950 font-extrabold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.15)] select-none border border-white/20">
              S
            </div>
            {sidebarOpen && (
              <span className="font-bold text-sm tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-300 to-slate-100 uppercase whitespace-nowrap">
                SEO Studio
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-250 ${
                  isActive 
                    ? 'bg-purple-500/10 text-purple-400 dark:text-purple-400 border-l-4 border-purple-500 glow-nav-active'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-350'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`transition-opacity duration-200 ${!sidebarOpen && 'lg:hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-purple-500/15 text-[10px] text-slate-500 font-mono tracking-wider">
          {sidebarOpen ? (
            <p className="text-center">AGENT STUDIO v1.0</p>
          ) : (
            <p className="text-center">V1</p>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
        {/* Top Header */}
        <header className="h-16 bg-white/70 dark:bg-darkBg/60 backdrop-blur-md border-b border-slate-200/50 dark:border-purple-500/15 sticky top-0 z-20 px-6 flex items-center justify-between transition-colors duration-300">
          {/* Breadcrumbs & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-500"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Breadcrumb Trial */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Workspace</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-purple-600 dark:text-purple-400 font-bold">{activeTab}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-6">
            {/* Domain SwitcherDropdown */}
            <div className="flex items-center gap-2 border border-slate-200/60 dark:border-purple-500/20 bg-slate-100/40 dark:bg-purple-950/20 px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-350 shadow-inner">
              <Globe className="w-3.5 h-3.5 text-purple-500" />
              <select 
                value={activeDomain}
                onChange={(e) => setActiveDomain(e.target.value)}
                className="bg-transparent border-none outline-none pr-1 text-xs font-bold focus:ring-0 cursor-pointer"
              >
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark/Light mode toggle - Luminous pulsing button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200/60 dark:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-purple-500/10 text-slate-500 dark:text-slate-400 transition-all duration-300 shadow-[0_0_10px_transparent] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.35)] cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-purple-500" />
              )}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200/50 dark:border-purple-500/15">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/10 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                OK
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Tab Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
