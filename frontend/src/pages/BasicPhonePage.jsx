import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PhoneCall, PhoneOff, Mic, Volume2, Radio, CheckCircle2, Sparkles } from 'lucide-react';

export default function BasicPhonePage() {
  const { t, language, speakText } = useLanguage();
  const isTe = language === 'te';

  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState('idle'); // idle | calling | connected | speaking | responding
  const [farmerVoiceText, setFarmerVoiceText] = useState('');
  const [ivrResponse, setIvrResponse] = useState('');

  const handleStartCall = () => {
    setCallActive(true);
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
      const greeting = isTe 
        ? "నమస్కారం! భూమివాణి వ్యవసాయ వాయిస్ సేవకు స్వాగతం. మీ పంట వివరాలు చెప్పండి..." 
        : "Hello! Welcome to BhūmiVāṇī AI agricultural voice service. Please speak your crop problem after the tone...";
      setIvrResponse(greeting);
      speakText(greeting);
    }, 1500);
  };

  const handleSimulateSpeaking = (presetText) => {
    const textToSay = presetText || (isTe ? "నా మిరప తోటలో ఆకులపై నల్ల మచ్చలు కనిపిస్తున్నాయి." : "My chilli leaves have dark spots.");
    setFarmerVoiceText(textToSay);
    setCallState('responding');

    setTimeout(() => {
      const responseText = isTe
        ? "భూమివాణి మీ వివరాలను విశ్లేషించింది. రాబోయే 24 గంటల్లో వర్షం సూచన ఉంది. ప్రస్తుతానికి మందులు పిచికారీ చేయవద్దు. గాలి పారుదల మెరుగుపరచండి."
        : "BhūmiVāṇī analyzed your query. Rain predicted in next 24h. Postpone chemical spraying now. Maintain proper drainage.";
      setIvrResponse(responseText);
      speakText(responseText);
      setCallState('connected');
    }, 2000);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setCallState('idle');
    setIvrResponse('');
    setFarmerVoiceText('');
    window.speechSynthesis?.cancel();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* PAGE TITLE */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Telephony IVR Extension Prototype</span>
        </div>
        <h1 className={`text-3xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
          {t('ivrTitle')}
        </h1>
        <p className={`text-sm text-slate-600 ${isTe ? 'te-text' : ''}`}>
          {t('ivrSub')}
        </p>
      </div>

      {/* ARCHITECTURE DIAGRAM */}
      <div className="agri-card p-6 space-y-4">
        <h3 className={`font-bold text-deepforest text-sm uppercase ${isTe ? 'te-text' : ''}`}>
          🌐 Cross-Channel Telephony Architecture
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-bold">
          <div className="p-3 bg-slate-100 rounded-xl border">☎️ Basic Phone</div>
          <div className="p-3 bg-emerald-100 rounded-xl border">📞 IVR Gateway</div>
          <div className="p-3 bg-amber-100 rounded-xl border">🎤 Speech-to-Text</div>
          <div className="p-3 bg-agri-500 text-white rounded-xl shadow">🤖 BhūmiVāṇī AI</div>
          <div className="p-3 bg-sky-100 rounded-xl border">🔊 Voice Response</div>
        </div>
      </div>

      {/* INTERACTIVE CALL SIMULATOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PHONE SIMULATOR UI */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border-4 border-slate-800 text-center">
          
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-600/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-mono">Toll-Free: 1800-BHUMI</h3>
            <p className="text-xs text-slate-400">BhūmiVāṇī Voice AI Helpline</p>
          </div>

          {/* SCREEN DISPLAY */}
          <div className="h-32 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-1">
            {callState === 'idle' && <p className="text-xs text-emerald-300">Press green button to initiate call simulation</p>}
            {callState === 'calling' && <p className="text-sm font-bold text-amber-300 animate-pulse">Dialing BhūmiVāṇī IVR...</p>}
            {(callState === 'connected' || callState === 'responding') && (
              <div className="space-y-1">
                <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold animate-pulse">CALL LIVE</span>
                <p className={`text-xs text-emerald-200 font-medium ${isTe ? 'te-text' : ''}`}>{ivrResponse}</p>
              </div>
            )}
          </div>

          {/* CALL CONTROLS */}
          {!callActive ? (
            <button
              onClick={handleStartCall}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <PhoneCall className="w-6 h-6" />
              <span>Start Phone Call</span>
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <PhoneOff className="w-6 h-6" />
              <span>End Call</span>
            </button>
          )}

        </div>

        {/* VOICE INPUT SIMULATION PRESETS */}
        <div className="agri-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className={`font-bold text-deepforest text-lg ${isTe ? 'te-text' : ''}`}>
              Speak into Phone Call
            </h3>
            <p className={`text-xs text-slate-600 ${isTe ? 'te-text' : ''}`}>
              Tap a sample voice statement to simulate speaking to the IVR assistant:
            </p>

            <div className="space-y-2">
              <button
                disabled={!callActive}
                onClick={() => handleSimulateSpeaking(isTe ? "నా మిరప ఆకులపై చిన్న గోధుమ మచ్చలు వచ్చాయి." : "Chilli leaves have small brown spots.")}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-agri-500 bg-slate-50 hover:bg-agri-50 font-medium text-xs text-slate-800 transition-all disabled:opacity-50"
              >
                🎤 {isTe ? '"నా మిరప ఆకులపై చిన్న గోధుమ మచ్చలు వచ్చాయి."' : '"Chilli leaves have small brown spots."'}
              </button>

              <button
                disabled={!callActive}
                onClick={() => handleSimulateSpeaking(isTe ? "వరి పొలంలో నా ఆకులు పసుపు రంగులోకి మారుతున్నాయి." : "Paddy blades turning yellow at tips.")}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-agri-500 bg-slate-50 hover:bg-agri-50 font-medium text-xs text-slate-800 transition-all disabled:opacity-50"
              >
                🎤 {isTe ? '"వరి పొలంలో ఆకులు పసుపు రంగులోకి మారుతున్నాయి."' : '"Paddy blades turning yellow at tips."'}
              </button>
            </div>
          </div>

          {farmerVoiceText && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold">Captured Speech:</span>
              <p>"{farmerVoiceText}"</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
