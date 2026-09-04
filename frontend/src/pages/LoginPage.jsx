import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import { Sprout, LogIn, UserPlus, Phone, Lock, User, MapPin, Sparkles, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { t, language, setLanguage } = useLanguage();
  const { login, signup } = useFarmer();
  const isTe = language === 'te';

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loginPhone, setLoginPhone] = useState('9876543210');
  const [loginPass, setLoginPass] = useState('1234');

  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    location: 'Vijayawada, Andhra Pradesh',
    crops: 'Chilli, Rice',
    preferredLanguage: language
  });

  const [error, setError] = useState('');

  const handleQuickDemoLogin = async () => {
    try {
      await login({
        name: "Demo Farmer (రైతు సోదరుడు)",
        phone: "+91 98765 43210",
        password: "1234"
      });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || "Demo login failed");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPhone) {
      setError(isTe ? "దయచేసి ఫోన్ నంబర్ లేదా ఫార్మర్ ID ఎంటర్ చేయండి." : "Please enter phone number or Farmer ID.");
      return;
    }
    try {
      setError('');
      const success = await login({ phone: loginPhone, password: loginPass });
      if (success && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || "Invalid login credentials");
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupData.name || !signupData.phone) {
      setError(isTe ? "దయచేసి పేరు మరియు ఫోన్ నంబర్ ఎంటర్ చేయండి." : "Please fill in your name and phone number.");
      return;
    }
    try {
      setError('');
      const success = await signup(signupData);
      if (success && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-emerald-100 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-700 via-agri-500 to-amber-400"></div>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-deepforest text-white mx-auto flex items-center justify-center text-3xl shadow-lg border border-agri-400/40">
            🌾
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-deepforest tracking-tight">
              BhūmiVāṇī <span className="text-agri-600 text-xl font-normal block sm:inline te-text">(भूमिवाणी)</span>
            </h1>
            <p className={`text-xs text-slate-500 mt-1 ${isTe ? 'te-text' : 'italic'}`}>
              "{t('tagline')}"
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'English లోకి మార్చండి' : 'Switch to తెలుగు'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3 shadow-inner">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{isTe ? "తక్షణ పరిశీలన కోసం 1-క్లిక్ డెమో లాగిన్" : "Instant 1-Click Demo Login"}</span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className={`w-full py-3 bg-agri-600 hover:bg-agri-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 ${isTe ? 'te-text' : ''}`}
          >
            <span>🌾 {isTe ? "రైతు డెమో లాగిన్ (1-Click Sign In)" : "Quick Demo Farmer Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mode === 'login'
                ? 'bg-deepforest text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isTe ? "లాగిన్ (Sign In)" : "Sign In"}</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              mode === 'signup'
                ? 'bg-deepforest text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isTe ? "కొత్త ఖాతా (Sign Up)" : "Sign Up"}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "ఫోన్ నంబర్ / ఫార్మర్ ID" : "Phone Number or Farmer ID"}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-agri-400 focus:border-agri-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "పాస్‌వర్డ్ / PIN" : "Password / PIN"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-agri-400 focus:border-agri-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 bg-deepforest hover:bg-deepforest-light text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${isTe ? 'te-text' : ''}`}
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>{isTe ? "లాగిన్ అవ్వండి (Sign In)" : "Sign In to Dashboard"}</span>
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "రైతు పేరు (Full Name)" : "Farmer Full Name"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "ఫోన్ నంబర్" : "Phone Number"}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "ప్రాంతం / గ్రామం" : "Location / Village"}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={signupData.location}
                  onChange={(e) => setSignupData({ ...signupData, location: e.target.value })}
                  placeholder="Vijayawada, Andhra Pradesh"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                {isTe ? "ముఖ్య పంటలు" : "Primary Crops (comma separated)"}
              </label>
              <input
                type="text"
                value={signupData.crops}
                onChange={(e) => setSignupData({ ...signupData, crops: e.target.value })}
                placeholder="Chilli, Rice, Cotton"
                className="w-full px-4 py-2.5 border rounded-xl text-sm font-medium text-slate-800"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 bg-agri-600 hover:bg-agri-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 ${isTe ? 'te-text' : ''}`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isTe ? "ఖాతా ప్రారంభించండి (Create Account)" : "Create Farmer Account & Login"}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t">
          <p className="text-[11px] text-slate-400">
            🔒 Safe & Secure AI Decision Support System built for Indian Farmers
          </p>
        </div>

      </div>
    </div>
  );
}