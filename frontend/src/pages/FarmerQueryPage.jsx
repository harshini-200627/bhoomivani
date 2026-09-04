import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import API_URL from '../services/api';
import { 
  MessageSquare, Mic, Send, Volume2, Save, RefreshCw, Sparkles, 
  MapPin, Sprout, AlertCircle, CheckCircle2, ShieldAlert, PhoneCall, PhoneOff, Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FarmerQueryPage() {
  const { t, language, setLanguage } = useLanguage();
  const { farmer, updateActiveCase } = useFarmer();
  const isTe = language === 'te';

  const welcomeGreeting = isTe
    ? 'భూమివాణికి స్వాగతం. నేను మీకు ఎలా సహాయం చేయగలను?'
    : 'Welcome to BhūmiVāṇī. How can I help you?';

  const waitingSpeechTe = 'దయచేసి వేచి ఉండండి. నేను మీ కోసం పరిశీలిస్తున్నాను.';
  const waitingSpeechEn = 'Please wait, I am checking that for you.';

  // State Management: 'idle' | 'listening' | 'checking' | 'speaking'
  const [callState, setCallState] = useState('idle');
  const [callActive, setCallActive] = useState(false);

  const [queryInput, setQueryInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bhoomivani',
      text: welcomeGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'BhūmiVāṇī Advisory'
    }
  ]);

  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const callActiveRef = useRef(false);
  const [voices, setVoices] = useState([]);

  // Load voices on mount
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Keep callActiveRef in sync
  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  // Quick suggestion prompts
  const suggestions = isTe ? [
    "🌶️ నా మిరప పంటకు నీళ్లు ఎప్పుడు పెట్టాలి?",
    "🍅 టమోటా మొక్కల ఆకులు పసుపు రంగులోకి మారుతున్నాయి, ఏం చేయాలి?",
    "🌾 ఎరువులు వేయడానికి వాతావరణం అనుకూలంగా ఉందా?",
    "🌧️ రేపు వర్షం పడే అవకాశం ఉందా? పిచికారీ చేయవచ్చా?",
    "🐛 పంటపై పురుగుల నివారణకు ఎలాంటి చర్యలు తీసుకోవాలి?",
    "🌊 భారీ వర్షాల సమయంలో పొలంలో తీసుకోవాల్సిన జాగ్రత్తలు?"
  ] : [
    "🌶️ When should I irrigate my chilli crop?",
    "🍅 Why are my tomato leaves turning yellow?",
    "🌾 Is the weather suitable to apply fertilizer today?",
    "🌧️ Can I spray pesticide today or is rain expected?",
    "🐛 How can I control pests attacking my crop?",
    "🌊 What precautions should I take during heavy rain?"
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, callState]);

  // Clean text helper for speech synthesis
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/^[ \t]*[-*•][ \t]+/gm, '')
      .replace(/[*_`#]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/%/g, ' percent')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  };

  // Helper to detect if a string contains Telugu characters
  const containsTelugu = (text) => {
    if (!text) return false;
    return /[\u0C00-\u0C7F]/.test(text);
  };

  // Text-to-Speech Helper with Guaranteed Native Telugu Audio & English SpeechSynthesis
  const currentAudioRef = useRef(null);

  const speakAndWait = (text, explicitLang = null) => {
    return new Promise((resolve) => {
      if (!text) {
        resolve();
        return;
      }

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) {
        resolve();
        return;
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {}
      }

      const isTextTelugu = explicitLang === 'te' || (!explicitLang && (containsTelugu(cleaned) || isTe));

      if (isTextTelugu) {
        try {
          const sentences = cleaned.match(/[^.!?।]+[.!?।]?/g) || [cleaned];
          let currentIdx = 0;

          const playNext = () => {
            if (currentIdx >= sentences.length) {
              resolve();
              return;
            }

            const sentence = sentences[currentIdx].trim();
            currentIdx++;

            if (!sentence) {
              playNext();
              return;
            }

            const audioUrl = `${API_URL}/api/tts?lang=te&text=${encodeURIComponent(sentence)}`;
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            audio.onended = () => playNext();
            audio.onerror = () => {
              fallbackSpeak(sentence, 'te-IN', () => playNext());
            };
            audio.play().catch(() => {
              fallbackSpeak(sentence, 'te-IN', () => playNext());
            });
          };

          playNext();
          return;
        } catch (err) {
          fallbackSpeak(cleaned, 'te-IN', resolve);
          return;
        }
      } else {
        fallbackSpeak(cleaned, 'en-US', resolve);
      }
    });
  };

  const fallbackSpeak = (text, langCode, resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    if (langCode === 'te-IN') {
      const teluguVoice = currentVoices.find(v => 
        v.lang.toLowerCase().includes('te') || 
        v.name.toLowerCase().includes('telugu')
      );
      if (teluguVoice) utterance.voice = teluguVoice;
    } else {
      const englishVoice = currentVoices.find(v => 
        v.lang.toLowerCase().includes('en')
      );
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Web Speech Recognition Controller (Supports Telugu & English)
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isTe ? "మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు." : "Voice recognition is not supported in this browser.");
      setCallState('idle');
      setCallActive(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
      }

      const recognition = new SpeechRecognition();
      // Listen in Telugu by default if in Telugu mode, or accept both
      recognition.lang = isTe ? 'te-IN' : 'en-IN';
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setCallState('listening');
      };

      recognition.onend = () => {
        if (callActiveRef.current && callState === 'listening') {
          try { recognition.start(); } catch(e){}
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        if (callActiveRef.current && e.error !== 'aborted') {
          setTimeout(() => {
            if (callActiveRef.current) {
              try { recognition.start(); } catch(e){}
            }
          }, 500);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          try { recognition.abort(); } catch(e){}
          handleProcessVoiceQuery(transcript.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech Recognition Exception:", err);
      setCallState('idle');
    }
  };

  // 1. START ADVISORY CALL
  const handleStartCall = async () => {
    setCallActive(true);
    callActiveRef.current = true;
    setCallState('speaking');

    // Speak welcome greeting
    await speakAndWait(welcomeGreeting, isTe ? 'te' : 'en');

    // Automatically begin listening
    if (callActiveRef.current) {
      setCallState('listening');
      startListening();
    }
  };

  // 2. END ADVISORY CALL
  const handleEndCall = () => {
    setCallActive(false);
    callActiveRef.current = false;
    setCallState('idle');

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e){}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // 3. PROCESS USER QUERY FROM VOICE (Dynamic Telugu / English handling)
  const handleProcessVoiceQuery = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return;

    // Detect language of the farmer's question
    const isQuestionTelugu = containsTelugu(transcriptText) || isTe;
    const detectedLang = isQuestionTelugu ? 'te' : 'en';

    // Immediately change state to Checking
    setCallState('checking');

    // Immediately speak waiting speech in the farmer's language
    const waitingSpeech = isQuestionTelugu ? waitingSpeechTe : waitingSpeechEn;
    speakAndWait(waitingSpeech, detectedLang);

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'farmer',
      text: transcriptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Multi-turn context: take last 3 recent turns
    const historyPayload = updatedMessages
      .filter(m => m.id !== 'welcome')
      .slice(-3)
      .map(m => ({ sender: m.sender, text: m.text }));

    try {
      const response = await fetch(`${API_URL}/api/farmer-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: transcriptText,
          conversationHistory: historyPayload,
          farmerContext: {
            farmerId: farmer.farmerId || 'Farmer',
            location: farmer.location || 'Vijayawada, AP',
            crops: farmer.crops || ['Chilli'],
            preferredLanguage: detectedLang
          },
          language: detectedLang
        })
      });

      const data = await response.json();
      const aiAnswerText = data.shortAdvisory || data.advisoryText || data.answer || (
        detectedLang === 'te' 
          ? "మీ పంటను నిశితంగా గమనించండి. వాతావరణ పరిస్థితులకు అనుగుణంగా తగిన చర్యలు తీసుకోండి." 
          : "Monitor your crop regularly. Take appropriate action based on current conditions."
      );

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'bhoomivani',
        text: aiAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'BhūmiVāṇī Advisory'
      };

      setMessages(prev => [...prev, aiMsg]);

      // Change state to Speaking and speak answer in the SAME language
      setCallState('speaking');
      await speakAndWait(aiAnswerText, detectedLang);

      // Automatically listen again for the next question if call still active
      if (callActiveRef.current) {
        setCallState('listening');
        startListening();
      } else {
        setCallState('idle');
      }
    } catch (error) {
      console.error("Voice Query Processing Error:", error);
      const fallbackText = detectedLang === 'te'
        ? "మీ పంటను నిశితంగా గమనించండి. వర్షం మరియు వాతావరణ పరిస్థితులకు అనుగుణంగా తగిన చర్యలు తీసుకోండి."
        : "Monitor your crop closely. Apply recommended agricultural practices based on current conditions.";
      
      const fallbackMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'bhoomivani',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'BhūmiVāṇī Advisory'
      };

      setMessages(prev => [...prev, fallbackMsg]);
      setCallState('speaking');
      await speakAndWait(fallbackText, detectedLang);

      if (callActiveRef.current) {
        setCallState('listening');
        startListening();
      } else {
        setCallState('idle');
      }
    }
  };

  // Standard Text Submit handler
  const handleSendTextQuery = async (overrideText) => {
    const textToSend = overrideText || queryInput;
    if (!textToSend || textToSend.trim().length === 0 || callState === 'checking') return;

    const isQuestionTelugu = containsTelugu(textToSend) || isTe;
    const detectedLang = isQuestionTelugu ? 'te' : 'en';

    setCallState('checking');
    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'farmer',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setQueryInput('');

    const historyPayload = updatedMessages
      .filter(m => m.id !== 'welcome')
      .slice(-3)
      .map(m => ({ sender: m.sender, text: m.text }));

    try {
      const response = await fetch(`${API_URL}/api/farmer-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend.trim(),
          conversationHistory: historyPayload,
          farmerContext: {
            farmerId: farmer.farmerId || 'Farmer',
            location: farmer.location || 'Vijayawada, AP',
            crops: farmer.crops || ['Chilli'],
            preferredLanguage: detectedLang
          },
          language: detectedLang
        })
      });

      const data = await response.json();
      const aiAnswerText = data.shortAdvisory || data.advisoryText || data.answer || (
        detectedLang === 'te' 
          ? "మీ పంటను నిశితంగా గమనించండి." 
          : "Monitor your crop regularly."
      );

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'bhoomivani',
        text: aiAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'BhūmiVāṇī Advisory'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Farmer Query Error:", err);
      const fallbackText = detectedLang === 'te'
        ? "మీ పంటను నిశితంగా గమనించండి. వర్షం మరియు వాతావరణ పరిస్థితులకు అనుగుణంగా తగిన చర్యలు తీసుకోండి."
        : "Monitor your crop closely. Apply recommended agricultural practices based on current weather conditions.";
      
      const fallbackMsg = {
        id: `ai-err-${Date.now()}`,
        sender: 'bhoomivani',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'BhūmiVāṇī Advisory'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setCallState('idle');
    }
  };

  const handleSaveToCases = async (msg) => {
    try {
      const res = await fetch(`${API_URL}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: farmer.farmerId,
          caseType: 'query',
          crop: farmer.crops?.[0] || 'General Crop',
          query: msg.text,
          symptoms: msg.text,
          advisoryText: msg.text,
          language: containsTelugu(msg.text) ? 'te' : 'en',
          status: 'Active'
        })
      });

      if (res.ok) {
        const createdCase = await res.json();
        if (updateActiveCase) updateActiveCase(createdCase);
        setSavedMessageIds(prev => new Set(prev).add(msg.id));
        try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } }); } catch(e){}
      }
    } catch(e) {
      console.error("Error saving case:", e);
    }
  };

  const handleListenAdvisory = (text) => {
    speakAndWait(text);
  };

  const handleClearSession = () => {
    handleEndCall();
    setMessages([
      {
        id: 'welcome',
        sender: 'bhoomivani',
        text: welcomeGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'BhūmiVāṇī Advisory'
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* PAGE HEADER BANNER */}
      <div className="bg-gradient-to-r from-deepforest via-emerald-900 to-deepforest-light text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/70 border border-agri-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
              <MapPin className="w-3 h-3" />
              <span>{farmer.location || 'Vijayawada, AP'}</span>
              <span className="opacity-50">•</span>
              <Sprout className="w-3 h-3 text-emerald-400" />
              <span>{Array.isArray(farmer.crops) ? farmer.crops.join(', ') : (farmer.crops || 'Farming')}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isTe ? 'te-text' : ''}`}>
              💬 {t('queryTitle')}
            </h1>
            <p className="text-xs text-emerald-200/90 font-medium">
              {t('querySubTitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Start / End Advisory Call Button */}
            {!callActive ? (
              <button
                onClick={handleStartCall}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
              >
                <PhoneCall className="w-4 h-4" />
                <span>📞 {isTe ? 'కాల్ ప్రారంభించండి (Start Call)' : 'Start Call'}</span>
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 animate-pulse"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{isTe ? 'కాల్ ముగించండి (End Call)' : 'End Call'}</span>
              </button>
            )}

            <button
              onClick={handleClearSession}
              className="px-3.5 py-2.5 bg-emerald-800/60 hover:bg-emerald-700 text-amber-200 border border-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0"
              title="New Conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('newConversation')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE CALL STATUS BAR (Active during voice dialogue) */}
      {callActive && (
        <div className="bg-slate-950 text-white p-4 rounded-2xl flex items-center justify-between border-2 border-emerald-500/50 shadow-lg">
          <div className="flex items-center space-x-3">
            <Radio className={`w-5 h-5 text-emerald-400 ${callState === 'listening' ? 'animate-ping' : 'animate-pulse'}`} />
            <div>
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                {callState === 'listening' && (isTe ? '🎙️ వింటున్నాము... (Listening)' : '🎙️ Listening to your question...')}
                {callState === 'checking' && (isTe ? '⚙️ పరిశీలిస్తున్నాము... (Checking)' : '⚙️ Checking for you...')}
                {callState === 'speaking' && (isTe ? '🔊 సమాధానం ఇస్తున్నాము... (Speaking)' : '🔊 Speaking response...')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isTe ? 'మీ ప్రశ్నను సహజంగా మాట్లాడండి' : 'Speak your farming question naturally in Telugu or English'}
              </p>
            </div>
          </div>

          <button
            onClick={handleEndCall}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            End Call
          </button>
        </div>
      )}

      {/* QUICK SUGGESTIONS CHIPS */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
          💡 {t('quickSuggestionsTitle')}
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => handleSendTextQuery(sugg.replace(/^[^\s]+\s/, ''))}
              className={`text-xs bg-white hover:bg-agri-50 border border-slate-200 hover:border-agri-400 text-slate-800 font-medium px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 text-left ${isTe ? 'te-text' : ''}`}
            >
              {sugg}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="agri-card p-4 sm:p-6 min-h-[420px] max-h-[600px] overflow-y-auto space-y-4 shadow-inner bg-slate-50/50 rounded-3xl border">
        {messages.map((msg) => {
          const isUser = msg.sender === 'farmer';
          const isSaved = savedMessageIds.has(msg.id);
          const isMsgTelugu = containsTelugu(msg.text);

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-md space-y-3 ${
                isUser
                  ? 'bg-emerald-700 text-white rounded-br-none'
                  : 'bg-white text-slate-900 border-2 border-emerald-100 rounded-bl-none'
              }`}>
                {/* Message Meta Header */}
                <div className="flex items-center justify-between border-b pb-2 border-black/10 gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold">
                      {isUser ? '👨‍🌾 You (రైతు)' : '🌾 BhūmiVāṇī AI (భూమివాణి)'}
                    </span>
                    {msg.modelUsed && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isUser ? 'bg-emerald-900/60 text-amber-200' : 'bg-emerald-100 text-emerald-950'
                      }`}>
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isUser ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Body Text */}
                <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium ${isMsgTelugu ? 'te-text' : ''}`}>
                  {msg.text}
                </div>

                {/* Response Action Bar (for AI replies) */}
                {!isUser && msg.id !== 'welcome' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleListenAdvisory(msg.text)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t('btnListenAudio')}</span>
                    </button>

                    <button
                      onClick={() => handleSaveToCases(msg)}
                      disabled={isSaved}
                      className={`px-3 py-1.5 bg-deepforest hover:bg-deepforest-light text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 ${
                        isSaved ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaved ? t('querySavedSuccess') : t('btnSaveQueryCase')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* CHECKING SPINNER */}
        {callState === 'checking' && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-agri-400 rounded-2xl p-4 shadow-md flex items-center space-x-3 text-deepforest">
              <Sparkles className="w-5 h-5 text-agri-600 animate-spin" />
              <span className="text-xs font-bold">
                {isTe ? "దయచేసి వేచి ఉండండి. నేను మీ కోసం పరిశీలిస్తున్నాను..." : "Please wait, I am checking that for you..."}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT TOOLBAR: VOICE & TEXT */}
      <div className="agri-card p-3 sm:p-4 border-2 border-agri-400 shadow-xl space-y-3">
        
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendTextQuery(); }}
          className="flex items-center space-x-2"
        >
          {/* Voice Call / Microphone Button */}
          <button
            type="button"
            onClick={callActive ? handleEndCall : handleStartCall}
            className={`p-3 sm:px-4 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shrink-0 shadow-md ${
              callActive
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
            }`}
            title="Start Continuous Voice Dialogue"
          >
            <Mic className={`w-5 h-5 ${callState === 'listening' ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline font-bold">
              {callActive ? (isTe ? 'కాల్ ఆపండి' : 'End Call') : (isTe ? 'వాయిస్ మాట్లాడండి' : 'Voice Call')}
            </span>
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={callState === 'checking'}
            placeholder={isTe ? "మీ వ్యవసాయ ప్రశ్నను ఇక్కడ అడగండి..." : "Type or speak your agriculture question here..."}
            className={`flex-grow p-3 sm:p-3.5 rounded-xl border border-slate-300 focus:border-agri-500 focus:ring-2 focus:ring-agri-200 text-slate-800 text-sm font-medium ${isTe ? 'te-text' : ''}`}
          />

          {/* Send Submit Button */}
          <button
            type="submit"
            disabled={callState === 'checking' || !queryInput.trim()}
            className={`px-5 py-3 sm:py-3.5 bg-agri-600 hover:bg-agri-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 ${
              callState === 'checking' || !queryInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{t('btnSend')}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Agricultural Voice Advisory • Natural Telugu & English Voice Output</span>
          </div>
          <span className="font-mono font-semibold text-emerald-800">
            Current Language: {isTe ? 'తెలుగు (Telugu)' : 'English'}
          </span>
        </div>

      </div>

    </div>
  );
}
