import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Camera, Mic, Keyboard, ArrowRight, ShieldCheck, CloudSun, PhoneCall, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ onSelectMode, onNavigate }) {
  const { t, language } = useLanguage();
  const isTe = language === 'te';

  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative hero-gradient text-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/40">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-agri-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-agri-300 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Agricultural Decision Support Platform</span>
          </div>

          {/* Titles */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              🌾 BhūmiVāṇī <span className="text-agri-300 text-3xl sm:text-5xl font-normal block sm:inline te-text">(भूमिवाणी)</span>
            </h1>
            <p className={`text-xl sm:text-3xl font-bold text-amber-200 ${isTe ? 'te-text' : 'font-serif italic'}`}>
              "{t('tagline')}"
            </p>
          </div>

          {/* Subtitle */}
          <p className={`max-w-3xl mx-auto text-base sm:text-xl text-emerald-100/90 leading-relaxed ${isTe ? 'te-text' : ''}`}>
            {t('heroLead')}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onSelectMode('show')}
              className={`w-full sm:w-auto px-8 py-4 bg-agri-500 hover:bg-agri-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-agri-500/30 transition-all flex items-center justify-center space-x-3 transform hover:-translate-y-0.5 ${isTe ? 'te-text' : ''}`}
            >
              <span>{t('btnAnalyzeCrop')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onSelectMode('speak')}
              className={`w-full sm:w-auto px-8 py-4 bg-emerald-950/80 hover:bg-emerald-900 border-2 border-agri-400/50 text-amber-200 font-bold text-lg rounded-2xl shadow-md transition-all flex items-center justify-center space-x-3 transform hover:-translate-y-0.5 ${isTe ? 'te-text' : ''}`}
            >
              <span>{t('btnTalkBhoomivani')}</span>
            </button>
          </div>

        </div>

        {/* HERO INTERACTION CARD: 3 Main Input Channels */}
        <div className="bg-white/95 backdrop-blur-md text-slate-900 border-t border-agri-100 p-8 sm:p-10 shadow-2xl">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className={`text-center text-xl sm:text-2xl font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('heroOptionHeader')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Option 1: SHOW */}
              <button
                onClick={() => onSelectMode('show')}
                className="group p-6 rounded-2xl border-2 border-emerald-100 hover:border-agri-500 bg-white hover:bg-agri-50/50 shadow-md hover:shadow-xl transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-emerald-900 group-hover:text-agri-700 ${isTe ? 'te-text' : ''}`}>
                      {t('optionShowTitle')}
                    </h3>
                    <p className={`text-sm text-slate-600 mt-1 ${isTe ? 'te-text' : ''}`}>
                      {t('optionShowSub')}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-agri-700">
                  <span>Start with Photo</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: SPEAK */}
              <button
                onClick={() => onSelectMode('speak')}
                className="group p-6 rounded-2xl border-2 border-emerald-100 hover:border-agri-500 bg-white hover:bg-agri-50/50 shadow-md hover:shadow-xl transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-emerald-900 group-hover:text-agri-700 ${isTe ? 'te-text' : ''}`}>
                      {t('optionSpeakTitle')}
                    </h3>
                    <p className={`text-sm text-slate-600 mt-1 ${isTe ? 'te-text' : ''}`}>
                      {t('optionSpeakSub')}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-agri-700">
                  <span>Speak in Voice</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 3: TYPE */}
              <button
                onClick={() => onSelectMode('type')}
                className="group p-6 rounded-2xl border-2 border-emerald-100 hover:border-agri-500 bg-white hover:bg-agri-50/50 shadow-md hover:shadow-xl transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Keyboard className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-emerald-900 group-hover:text-agri-700 ${isTe ? 'te-text' : ''}`}>
                      {t('optionTypeTitle')}
                    </h3>
                    <p className={`text-sm text-slate-600 mt-1 ${isTe ? 'te-text' : ''}`}>
                      {t('optionTypeSub')}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-agri-700">
                  <span>Optional Text Input</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>

            <p className={`text-center text-xs text-slate-500 italic pt-2 ${isTe ? 'te-text' : ''}`}>
              💡 {t('typingOptional')}
            </p>

          </div>
        </div>

      </section>

      {/* HOW IT WORKS SECTION (4 STEPS) */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className={`text-3xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
            {t('howItWorksTitle')}
          </h2>
          <p className={`text-sm text-slate-600 ${isTe ? 'te-text' : ''}`}>
            {t('howItWorksSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="agri-card p-6 space-y-4 relative">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              STEP 1
            </span>
            <h3 className={`text-lg font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('step1Title')}
            </h3>
            <p className={`text-xs text-slate-600 leading-relaxed ${isTe ? 'te-text' : ''}`}>
              {t('step1Desc')}
            </p>
          </div>

          <div className="agri-card p-6 space-y-4 relative">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              STEP 2
            </span>
            <h3 className={`text-lg font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('step2Title')}
            </h3>
            <p className={`text-xs text-slate-600 leading-relaxed ${isTe ? 'te-text' : ''}`}>
              {t('step2Desc')}
            </p>
          </div>

          <div className="agri-card p-6 space-y-4 relative">
            <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full">
              STEP 3
            </span>
            <h3 className={`text-lg font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('step3Title')}
            </h3>
            <p className={`text-xs text-slate-600 leading-relaxed ${isTe ? 'te-text' : ''}`}>
              {t('step3Desc')}
            </p>
          </div>

          <div className="agri-card p-6 space-y-4 relative border-agri-400">
            <span className="inline-block px-3 py-1 bg-agri-500 text-white text-xs font-bold rounded-full">
              STEP 4
            </span>
            <h3 className={`text-lg font-bold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('step4Title')}
            </h3>
            <p className={`text-xs text-slate-600 leading-relaxed ${isTe ? 'te-text' : ''}`}>
              {t('step4Desc')}
            </p>
          </div>

        </div>
      </section>

      {/* BASIC PHONE / IVR PROTOTYPE PREVIEW SECTION */}
      <section className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-amber-200/60 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Voice Channel Prototype</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
              {t('ivrTitle')}
            </h2>
            <p className={`text-sm text-slate-700 leading-relaxed max-w-xl ${isTe ? 'te-text' : ''}`}>
              {t('ivrSub')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('ivr')}
            className={`px-6 py-3.5 bg-deepforest hover:bg-deepforest-light text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 whitespace-nowrap ${isTe ? 'te-text' : ''}`}
          >
            <PhoneCall className="w-5 h-5 text-amber-300" />
            <span>{t('btnSimulateCall')}</span>
          </button>
        </div>
      </section>

    </div>
  );
}
