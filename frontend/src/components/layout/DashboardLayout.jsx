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
    <div className="min-h-screen bg-lightBg dark:bg-darkBg text-slate-700 dark:text-slate-200 flex transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-lightPanel dark:bg-darkPanel border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
              S
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 whitespace-nowrap">
                SEO Studio
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {(sidebarOpen || !sidebarOpen) && (
                  <span className={`transition-opacity duration-200 ${!sidebarOpen && 'lg:hidden'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
          {sidebarOpen ? (
            <p>SEO Agent SaaS Studio &copy; 2026</p>
          ) : (
            <p className="text-center">&copy;</p>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
        {/* Top Header */}
        <header className="h-16 bg-lightPanel dark:bg-darkPanel border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 flex items-center justify-between transition-colors duration-300">
          {/* Breadcrumbs & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-500"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Breadcrumb Trial */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
              <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Workspace</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{activeTab}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4">
            {/* Domain Switcher */}
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300">
              <Globe className="w-4 h-4 text-indigo-500" />
              <select 
                value={activeDomain}
                onChange={(e) => setActiveDomain(e.target.value)}
                className="bg-transparent border-none outline-none pr-2 text-sm font-medium focus:ring-0 cursor-pointer"
              >
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain} className="bg-lightPanel dark:bg-darkPanel text-slate-800 dark:text-slate-200">
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Dashboard Tab Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/20 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
