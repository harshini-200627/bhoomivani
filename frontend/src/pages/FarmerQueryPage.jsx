import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import API_URL from '../services/api';
import { 
  MessageSquare, Mic, Send, Volume2, Save, RefreshCw, Sparkles, 
  MapPin, Sprout, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FarmerQueryPage() {
  const { t, language } = useLanguage();
  const { farmer, updateActiveCase } = useFarmer();
  const isTe = language === 'te';

  const welcomeGreeting = isTe
    ? 'నమస్కారం! నేను మీ భూమివాణి AI వ్యవసాయ సహాయకుడిని. మీ పంట, నీటి పారుదల, ఎరువులు, పురుగుల నివారణ లేదా వాతావరణానికి సంబంధించిన ఏదైనా ప్రశ్నను టైప్ చేసి లేదా మైక్రోఫోన్ ద్వారా మాట్లాడి అడగండి.'
    : 'Greetings! I am your BhūmiVāṇī AI agricultural advisor. Ask any question about your crop, irrigation, fertilizer, pest control, or weather using text or voice microphone.';

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

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [voices, setVoices] = useState([]);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Load available speech synthesis voices
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isListening]);

  // Helper to detect if text contains Telugu Unicode characters
  const containsTelugu = (text) => {
    if (!text) return false;
    return /[\u0C00-\u0C7F]/.test(text);
  };

  // Helper to clean formatting characters before TTS
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

  // Text-to-Speech Helper (Supports Telugu API TTS + Web SpeechSynthesis)
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
          const sentences = cleaned.match(/[^.!?।]+[.!?<ctrl42>]?/g) || [cleaned];
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

  // Microphone Speech Recognition Handler (Browser Voice Input)
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isTe ? "మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి." : "Voice recognition is not supported in your browser. Please type your question.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
      }

      const recognition = new SpeechRecognition();
      // Use Telugu speech recognition if app is in Telugu or detect mixed speech
      recognition.lang = isTe ? 'te-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          const text = transcript.trim();
          setQueryInput(text);
          setIsListening(false);
          // Automatically send the recognized spoken question to AI
          handleSendQuery(text);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech Recognition Exception:", err);
      setIsListening(false);
    }
  };

  // Send Farmer Question (Text or Voice Input) to AI Advisory Backend
  const handleSendQuery = async (overrideText) => {
    const textToSend = overrideText || queryInput;
    if (!textToSend || !textToSend.trim() || loading) return;

    const isQuestionTelugu = containsTelugu(textToSend) || isTe;
    const detectedLang = isQuestionTelugu ? 'te' : 'en';

    setLoading(true);

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

    // Recent 3 conversation turns payload for context
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
          ? "మీ పంటను నిశితంగా గమనించండి. ప్రస్తుత వాతావరణానికి అనుగుణంగా తగిన చర్యలు తీసుకోండి." 
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

      // Automatically speak the AI response in the recognized language
      speakAndWait(aiAnswerText, detectedLang);
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
      speakAndWait(fallbackText, detectedLang);
    } finally {
      setLoading(false);
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
    const isMsgTelugu = containsTelugu(text) || isTe;
    speakAndWait(text, isMsgTelugu ? 'te' : 'en');
  };

  const handleClearSession = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* PAGE HEADER BANNER */}
      <div className="bg-gradient-to-r from-deepforest via-emerald-900 to-deepforest-light text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-950/70 border border-agri-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{farmer.location || 'Vijayawada, AP'}</span>
              <span className="opacity-50">•</span>
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>{Array.isArray(farmer.crops) ? farmer.crops.join(', ') : (farmer.crops || 'Farming')}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isTe ? 'te-text' : ''}`}>
              💬 {t('queryTitle')}
            </h1>
            <p className="text-xs text-emerald-200/90 font-medium">
              {t('querySubTitle')}
            </p>
          </div>

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

      {/* QUICK SUGGESTIONS CHIPS */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
          💡 {t('quickSuggestionsTitle')}
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(sugg.replace(/^[^\s]+\s/, ''))}
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

        {/* LOADING / PROCESSING SPINNER */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-agri-400 rounded-2xl p-4 shadow-md flex items-center space-x-3 text-deepforest">
              <Sparkles className="w-5 h-5 text-agri-600 animate-spin" />
              <span className="text-xs font-bold">
                {isTe ? "దయచేసి వేచి ఉండండి. భూమివాణి సమాధానం సిద్ధం చేస్తోంది..." : "Please wait, BhūmiVāṇī is analyzing your question..."}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT TOOLBAR: TEXT INPUT + MICROPHONE VOICE INPUT */}
      <div className="agri-card p-3 sm:p-4 border-2 border-agri-400 shadow-xl space-y-3">
        
        {isListening && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-red-600 animate-bounce" />
              <span>{isTe ? '🎙️ వింటున్నాము... మీ వ్యవసాయ ప్రశ్నను మాట్లాడండి' : '🎙️ Listening... Speak your farming question now'}</span>
            </div>
            <button
              type="button"
              onClick={toggleVoiceInput}
              className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700"
            >
              Stop
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
          className="flex items-center space-x-2"
        >
          {/* Microphone Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 sm:px-4 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shrink-0 shadow-md ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
            }`}
            title="Tap to Speak (Telugu / English)"
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline font-bold">
              {isListening ? (isTe ? 'వింటోంది...' : 'Listening...') : (isTe ? 'మాట్లాడండి (Speak)' : 'Speak')}
            </span>
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={loading}
            placeholder={isTe ? "మీ వ్యవసాయ ప్రశ్నను ఇక్కడ టైప్ చేయండి లేదా మాట్లాడండి..." : "Type or speak your agriculture question..."}
            className={`flex-grow p-3 sm:p-3.5 rounded-xl border border-slate-300 focus:border-agri-500 focus:ring-2 focus:ring-agri-200 text-slate-800 text-sm font-medium ${isTe ? 'te-text' : ''}`}
          />

          {/* Send Submit Button */}
          <button
            type="submit"
            disabled={loading || !queryInput.trim()}
            className={`px-5 py-3 sm:py-3.5 bg-agri-600 hover:bg-agri-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 ${
              loading || !queryInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{t('btnSend')}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Agricultural Advisory • Text & Voice Microphone Input (Telugu & English)</span>
          </div>
          <span className="font-mono font-semibold text-emerald-800">
            Language: {isTe ? 'తెలుగు (Telugu)' : 'English'}
          </span>
        </div>

      </div>

    </div>
  );
}
