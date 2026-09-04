import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import { Sprout, Mic, LayoutDashboard, FolderKanban, CloudSun, User, PhoneCall, Globe, LogOut, MessageSquare } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { language, setLanguage, t } = useLanguage();
  const { farmer, logout } = useFarmer();

  const toggleLanguage = () => {
    setLanguage(language === 'te' ? 'en' : 'te');
  };

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'query', label: t('navQuery'), icon: MessageSquare },
    { id: 'analyze', label: t('navAnalyze'), icon: Mic },
    { id: 'cases', label: t('navCases'), icon: FolderKanban },
    { id: 'weather', label: t('navWeather'), icon: CloudSun },
    { id: 'ivr', label: t('navIVR'), icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 bg-deepforest shadow-md border-b border-deepforest-light/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center space-x-3 text-left focus:outline-none group"
        >
          <div className="w-12 h-12 rounded-xl bg-agri-500/20 border border-agri-400/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
            🌾
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-white tracking-wide">BhūmiVāṇī</span>
              <span className="text-sm font-semibold text-agri-300 te-text">भूमिवाणी</span>
            </div>
            <p className="text-xs text-emerald-200/80 italic hidden sm:block">
              "{t('tagline')}"
            </p>
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-agri-600 text-white shadow-sm'
                    : 'text-emerald-100/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className={language === 'te' ? 'te-text' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Controls: Language Switcher, Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-agri-400/40 text-amber-200 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-agri-400" />
            <span className="uppercase">{language === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>

          {/* Farmer Profile Button */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{farmer.farmerId}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
            title="Sign Out / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>

      {/* Mobile Navigation bar at bottom of screen */}
      <div className="md:hidden bg-deepforest-dark border-t border-emerald-900 px-2 py-2 flex justify-around items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded text-xs ${
                isActive ? 'text-agri-400 font-bold' : 'text-emerald-200/70'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className={`text-[10px] ${language === 'te' ? 'te-text' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
