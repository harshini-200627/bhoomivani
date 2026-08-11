import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { FarmerAuthProvider } from './context/FarmerAuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CropAnalysisPage from './pages/CropAnalysisPage';
import CasesPage from './pages/CasesPage';
import WeatherPage from './pages/WeatherPage';
import ProfilePage from './pages/ProfilePage';
import BasicPhonePage from './pages/BasicPhonePage';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [analysisMode, setAnalysisMode] = useState('show');
  const { t, language } = useLanguage();
  const isTe = language === 'te';

  const handleSelectMode = (mode) => {
    setAnalysisMode(mode);
    setActiveTab('analyze');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F2]">
      
      {/* NAVBAR */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT ROUTING */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow w-full">
        {activeTab === 'home' && (
          <LandingPage onSelectMode={handleSelectMode} onNavigate={setActiveTab} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPage onNavigate={setActiveTab} onSelectMode={handleSelectMode} />
        )}
        {activeTab === 'analyze' && (
          <CropAnalysisPage initialMode={analysisMode} onNavigate={setActiveTab} />
        )}
        {activeTab === 'cases' && (
          <CasesPage />
        )}
        {activeTab === 'weather' && (
          <WeatherPage />
        )}
        {activeTab === 'profile' && (
          <ProfilePage />
        )}
        {activeTab === 'ivr' && (
          <BasicPhonePage />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-deepforest text-white border-t border-emerald-900 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-emerald-800/60 pb-8">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-2xl">🌾</span>
                <span className="text-2xl font-extrabold text-white">BhūmiVāṇī</span>
                <span className="text-sm text-agri-300 font-bold te-text">भूमिवाणी</span>
              </div>
              <p className={`text-xs text-emerald-200/80 ${isTe ? 'te-text' : 'italic'}`}>
                "{t('tagline')}"
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs text-emerald-200 font-medium">
              <button onClick={() => setActiveTab('home')}>{t('navHome')}</button>
              <button onClick={() => setActiveTab('dashboard')}>{t('navDashboard')}</button>
              <button onClick={() => setActiveTab('analyze')}>{t('navAnalyze')}</button>
              <button onClick={() => setActiveTab('cases')}>{t('navCases')}</button>
              <button onClick={() => setActiveTab('weather')}>{t('navWeather')}</button>
              <button onClick={() => setActiveTab('ivr')}>{t('navIVR')}</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
            <p>© 2026 BhūmiVāṇī Agricultural Decision Support Platform. Built for Farmers.</p>
            <p className="italic">"The technology should adapt to the farmer."</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <FarmerAuthProvider>
        <AppContent />
      </FarmerAuthProvider>
    </LanguageProvider>
  );
}
