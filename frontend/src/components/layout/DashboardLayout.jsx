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
  ChevronLeft, 
  ChevronRight,
  Globe 
} from 'lucide-react';
import { useAgentAPI } from '../../hooks/useAgentAPI.js';
import AddPropertyModal from '../modals/AddPropertyModal.jsx';

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  activeDomain, 
  setActiveDomain 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { fetchProperties } = useAgentAPI();
  const [properties, setProperties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCleanDomain = (url) => {
    if (!url) return '';
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  };

  const loadProperties = async () => {
    try {
      const result = await fetchProperties();
      if (result && result.success && result.data) {
        setProperties(result.data);
      }
    } catch (err) {
      console.warn("Failed to load properties, using static defaults:", err.message);
      setProperties(['example.com', 'techventures.io', 'saasgrowth.org']);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === 'ADD_NEW_PROPERTY') {
      setIsModalOpen(true);
    } else {
      setActiveDomain(value);
    }
  };

  const handleAddPropertySuccess = (newProperty) => {
    const cleanDomain = getCleanDomain(newProperty.domainUrl);
    setProperties(prev => [...prev, newProperty]);
    setActiveDomain(cleanDomain);
    setIsModalOpen(false);
  };

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
    <div className="min-h-screen bg-gray-50 text-gray-800 flex font-sans antialiased">
      {/* Sidebar Overlay for Mobile */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/10 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Left Sidebar - Solid White with Right Border */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-150">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded bg-gray-950 text-white font-black flex items-center justify-center text-xs tracking-tighter">
              S
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-xs tracking-wider text-gray-900 uppercase">
                SEO Studio
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Domain Switcher (Linear/Vercel style Team Switcher) */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-150">
            <div className="flex items-center gap-2 border border-gray-200 bg-gray-50/50 px-3 py-2 rounded-lg text-xs">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <select 
                value={activeDomain}
                onChange={handleDropdownChange}
                className="w-full bg-transparent border-none outline-none font-semibold text-gray-700 cursor-pointer focus:ring-0 focus:outline-none"
              >
                {properties.map((prop) => {
                  const clean = getCleanDomain(prop.domainUrl || prop);
                  return (
                    <option key={clean} value={clean} className="bg-white text-gray-800">
                      {clean}
                    </option>
                  );
                })}
                <option value="" disabled>──────────</option>
                <option value="ADD_NEW_PROPERTY" className="text-indigo-600 font-bold bg-white">
                  + Add New Website
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Sidebar Nav Items - Simple text with gray-100 active state */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                <span className={`transition-opacity duration-150 ${!sidebarOpen && 'lg:hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-150 text-[10px] text-gray-400 font-mono tracking-wider uppercase text-center select-none">
            SEO Agent SaaS v1.0
          </div>
        )}
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-205 ${
        sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
        {/* Top Header - Stark Border Bottom Only, Completely Empty except Breadcrumbs and Avatar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-gray-100 lg:hidden text-gray-500"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Crisp Breadcrumb trail */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 select-none">
              <span className="hover:text-gray-600 cursor-pointer transition-colors">Workspace</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-bold">{activeTab}</span>
            </div>
          </div>

          {/* User Profile Circular Avatar */}
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[10px] font-extrabold flex items-center justify-center border border-gray-200 select-none shadow-sm cursor-pointer hover:bg-gray-800 transition-colors">
              OK
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Modal Add Property Wizard Overlay */}
      {isModalOpen && (
        <AddPropertyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleAddPropertySuccess} 
        />
      )}
    </div>
  );
}
