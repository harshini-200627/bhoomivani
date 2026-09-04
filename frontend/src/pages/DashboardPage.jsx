import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import { Camera, Mic, FolderKanban, CloudSun, ArrowRight, Activity, MapPin, RefreshCw } from 'lucide-react';

export default function DashboardPage({ onNavigate, onSelectMode }) {
  const { t, language } = useLanguage();
  const { farmer, activeCase } = useFarmer();
  const isTe = language === 'te';

  const [weatherData, setWeatherData] = useState({
    temperature: "31°C",
    humidity: "78%",
    rainProbability: "35%",
    spraySuitability: "Favorable",
    locationName: "Vijayawada, AP"
  });

  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      const res = await fetch('/api/weather');
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      }
    } catch (e) {
      console.log("Using cached weather data");
    } finally {
      setLoadingWeather(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* WELCOME HERO BANNER */}
      <div className="bg-gradient-to-r from-deepforest via-deepforest-light to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-agri-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{farmer.location}</span>
            </div>
            <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isTe ? 'te-text' : ''}`}>
              {t('welcomeBack')} {farmer.name} 👨‍🌾
            </h1>
            <p className="text-sm text-emerald-200/90 font-medium">
              {t('farmerIdLabel')}: <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-amber-200 font-bold">{farmer.farmerId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('query')}
              className={`px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg transition-all flex items-center space-x-2 text-sm ${isTe ? 'te-text' : ''}`}
            >
              <span>💬 {isTe ? 'AI అడ్వైజరీ' : 'AI Advisory'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectMode('show')}
              className={`px-5 py-3 bg-agri-500 hover:bg-agri-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center space-x-2 text-sm ${isTe ? 'te-text' : ''}`}
            >
              <span>📷 {t('btnAnalyzeCrop')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROMINENT AI ADVISORY CARD */}
      <div className="bg-gradient-to-r from-emerald-900 via-deepforest to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-agri-400/50 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
              <span>🤖 AI Agricultural Advisory System</span>
            </div>
            <h2 className={`text-2xl font-extrabold ${isTe ? 'te-text' : ''}`}>
              AI Advisory ({isTe ? 'AI వ్యవసాయ సలహాదారు' : 'AI Voice Assistant'})
            </h2>
            <p className={`text-sm text-emerald-200/90 ${isTe ? 'te-text' : ''}`}>
              "Ask any farming question and get direct personalized guidance in your language."
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('query')}
              className={`px-5 py-2.5 bg-agri-500 hover:bg-agri-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-2 ${isTe ? 'te-text' : ''}`}
            >
              <span>⌨️ Ask Question</span>
            </button>

            <button
              onClick={() => onNavigate('query')}
              className={`px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-2 ${isTe ? 'te-text' : ''}`}
            >
              <Mic className="w-4 h-4" />
              <span>🎙️ Start Voice Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="space-y-4">
        <h2 className={`text-xl font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
          {t('quickActionsTitle')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => onSelectMode('show')}
            className="agri-card p-5 text-left space-y-3 group hover:border-agri-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>{t('optionShowTitle')}</h3>
              <p className={`text-xs text-slate-500 mt-0.5 ${isTe ? 'te-text' : ''}`}>{t('optionShowSub')}</p>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('speak')}
            className="agri-card p-5 text-left space-y-3 group hover:border-agri-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>{t('optionSpeakTitle')}</h3>
              <p className={`text-xs text-slate-500 mt-0.5 ${isTe ? 'te-text' : ''}`}>{t('optionSpeakSub')}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('cases')}
            className="agri-card p-5 text-left space-y-3 group hover:border-agri-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>{t('navCases')}</h3>
              <p className={`text-xs text-slate-500 mt-0.5 ${isTe ? 'te-text' : ''}`}>View & Continue</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('weather')}
            className="agri-card p-5 text-left space-y-3 group hover:border-agri-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>{t('navWeather')}</h3>
              <p className={`text-xs text-slate-500 mt-0.5 ${isTe ? 'te-text' : ''}`}>Local Agricultural Forecast</p>
            </div>
          </button>

        </div>
      </div>

      {/* ACTIVE CASE & WEATHER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ACTIVE CASE MEMORY CARD */}
        <div className="lg:col-span-2 agri-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-agri-600 animate-pulse" />
              <h3 className={`font-bold text-lg text-deepforest ${isTe ? 'te-text' : ''}`}>
                {t('activeCaseTitle')}
              </h3>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-mono text-xs font-bold rounded-full">
              {activeCase.caseId}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Crop:</span>
              <span className="text-sm font-bold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                {activeCase.crop}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase">Problem Overview:</span>
              <p className={`text-sm text-slate-800 font-medium mt-1 ${isTe ? 'te-text' : ''}`}>
                {activeCase.problemTitle || activeCase.symptoms}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <span className="font-bold">Latest Status:</span>
              <p>{activeCase.status} — {activeCase.aiAnalysis?.possibleIssue || 'Monitoring symptoms'}</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => onNavigate('cases')}
              className={`px-4 py-2 bg-deepforest text-white font-bold text-xs rounded-xl hover:bg-deepforest-light transition-all flex items-center space-x-2 ${isTe ? 'te-text' : ''}`}
            >
              <span>Continue This Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* WEATHER SUMMARY WIDGET */}
        <div className="agri-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className={`font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
                {t('weatherSummaryTitle')}
              </h3>
              <button onClick={fetchWeather} className="text-slate-400 hover:text-agri-600 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loadingWeather ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CloudSun className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{weatherData.temperature}</p>
                  <p className="text-xs text-slate-500 font-medium">{weatherData.locationName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Humidity</span>
                <span className="font-bold text-slate-800 text-sm">{weatherData.humidity}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Rain Chance</span>
                <span className="font-bold text-slate-800 text-sm">{weatherData.rainProbability}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('weather')}
            className={`w-full py-2.5 bg-agri-50 hover:bg-agri-100 text-agri-800 font-bold text-xs rounded-xl border border-agri-200 transition-all text-center ${isTe ? 'te-text' : ''}`}
          >
            View Weather Decision Window
          </button>
        </div>

      </div>

    </div>
  );
}
