import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API_URL from '../services/api';
import {
  PhoneCall,
  PhoneOff,
  Radio,
  CheckCircle2,
  Sparkles,
  UserRound,
  FileText,
  Search,
  ArrowRight,
  RotateCcw,
  Mic,
  ThumbsUp,
  MinusCircle,
  AlertTriangle,
  Volume2
} from 'lucide-react';

export default function BasicPhonePage({ onNavigate }) {
  const { t, language } = useLanguage();
  const isTe = language === 'te';

  // =====================================================
  // BASIC STATES
  // =====================================================
  const [callActive, setCallActive] = useState(false);
  const [callMode, setCallMode] = useState('advisory'); // 'advisory' | 'new' | 'returning'
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'connected' | 'listening' | 'responding'
  const [callerPhone, setCallerPhone] = useState('9876543210');
  const [ivrResponse, setIvrResponse] = useState('');
  const [farmerVoiceText, setFarmerVoiceText] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [problemText, setProblemText] = useState('');
  const [generalQueryText, setGeneralQueryText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [previousCase, setPreviousCase] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multi-turn advisory conversation history
  const [advisoryHistory, setAdvisoryHistory] = useState([]);

  // Follow-up states (for returning farmer)
  const [showCropCondition, setShowCropCondition] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResult, setFollowUpResult] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  const recognitionRef = useRef(null);
  const callActiveRef = useRef(false);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  // Load voices asynchronously
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // =====================================================
  // LANGUAGE DETECTION FROM FARMER'S SPOKEN TRANSCRIPT
  // =====================================================
  function detectSpokenLanguage(transcript) {
    if (!transcript) return isTe ? "te" : "en";
    // Check Telugu Unicode block: \u0C00-\u0C7F
    if (/[\u0C00-\u0C7F]/.test(transcript)) {
      return "te";
    }
    // Check common Telugu transliterations
    const teluguKeywords = [
      "varsham", "eruvulu", "panta", "cheyavacha", "cheyali", "pettali", "neeru", "thadi",
      "mandu", "mandulu", "aaku", "pachha", "pasupu", "machalu", "purugu", "undha", "undi"
    ];
    const words = transcript.toLowerCase().split(/\s+/);
    if (words.some(w => teluguKeywords.includes(w))) {
      return "te";
    }
    return "en";
  }

  // =====================================================
  // CLEAN TEXT FOR SPEECH (Preserves Full Answer, Cleans Formatting)
  // =====================================================
  function cleanTextForSpeech(text) {
    if (!text) return "";

    return text
      .replace(/[*#_`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =====================================================
  // RELIABLE ADVISORY TTS (Native Telugu Audio + English Web Speech)
  // =====================================================
  function speakAdvisoryAnswer(text, targetLanguage = "en") {
    return new Promise((resolve) => {
      if (!text || !text.trim()) {
        console.warn("TTS: No text to speak");
        resolve();
        return;
      }

      const speechText = cleanTextForSpeech(text);
      if (!speechText) {
        console.warn("TTS: Cleaned text is empty");
        resolve();
        return;
      }

      // Stop any previous browser speech or audio
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {}
      }

      const isTelugu = targetLanguage === "te" || /[\u0C00-\u0C7F]/.test(speechText);

      console.log("===== TTS START =====");
      console.log("Speech Text:", speechText);
      console.log("Target Language:", targetLanguage);
      console.log("Is Telugu:", isTelugu);

      if (isTelugu) {
        // High-Quality Native Telugu Audio Engine (Ensures 100% natural Telugu voice without missing words)
        try {
          // Chunk sentences so every sentence is clearly pronounced
          const sentences = speechText.match(/[^.!?।]+[.!?।]?/g) || [speechText];
          let currentIdx = 0;

          const playNextSentence = () => {
            if (currentIdx >= sentences.length) {
              console.log("TTS: TELUGU SPEECH FINISHED");
              console.log("===== TTS END =====");
              resolve();
              return;
            }

            const sentence = sentences[currentIdx].trim();
            currentIdx++;

            if (!sentence) {
              playNextSentence();
              return;
            }

            const audioUrl = `${API_URL}/api/tts?lang=te&text=${encodeURIComponent(sentence)}`;
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            audio.onplay = () => {
              console.log("TTS: TELUGU AUDIO PLAYING:", sentence);
            };

            audio.onended = () => {
              playNextSentence();
            };

            audio.onerror = () => {
              console.warn("Telugu Audio stream error, falling back to Web Speech");
              fallbackWebSpeech(sentence, "te-IN", () => playNextSentence());
            };

            audio.play().catch(() => {
              fallbackWebSpeech(sentence, "te-IN", () => playNextSentence());
            });
          };

          playNextSentence();
          return;
        } catch (err) {
          console.warn("Telugu audio initialization error:", err);
          fallbackWebSpeech(speechText, "te-IN", resolve);
          return;
        }
      } else {
        // English SpeechSynthesis
        fallbackWebSpeech(speechText, "en-US", resolve);
      }
    });
  }

  function fallbackWebSpeech(text, langCode, resolve) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    if (langCode === "te-IN") {
      const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("te")) ||
                    voices.find(v => v.name && v.name.toLowerCase().includes("telugu"));
      if (voice) utterance.voice = voice;
    } else {
      const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("en"));
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      console.log("TTS: SPEECH STARTED");
    };
    utterance.onend = () => {
      console.log("TTS: SPEECH FINISHED");
      resolve();
    };
    utterance.onerror = (e) => {
      console.error("TTS ERROR:", e);
      resolve();
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  // =====================================================
  // SPEECH RECOGNITION (Dynamic Language)
  // =====================================================
  const startAdvisoryListening = (currentLang = 'te') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = currentLang === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setCallState('listening');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        setIsListening(false);
        if (callActiveRef.current && e.error !== 'aborted') {
          setTimeout(() => {
            if (callActiveRef.current && callMode === 'advisory') {
              try { recognition.start(); } catch (err) {}
            }
          }, 600);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          try { recognition.abort(); } catch (e) {}
          handleProcessAdvisoryQuery(transcript.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech Recognition Exception:", err);
      setIsListening(false);
    }
  };

  // =====================================================
  // 1. BASIC PHONE ADVISORY CALL (Conversational Q&A)
  // =====================================================
  const handleStartAdvisoryCall = async () => {
    setCallMode('advisory');
    setCallActive(true);
    callActiveRef.current = true;
    setCallState('calling');
    setAnalysis(null);
    setPreviousCase(null);
    setProblemText('');
    setGeneralQueryText('');
    setFarmerVoiceText('');
    setAdvisoryHistory([]);

    const greetingLang = isTe ? "te" : "en";
    const greeting = greetingLang === "te"
      ? 'భూమివాణి నుండి నమస్కారం. నేను మీకు ఎలా సహాయం చేయగలను?'
      : 'Hello from BhūmiVāṇī. How can I help you?';

    setIvrResponse(greeting);
    setCallState('connected');

    // Speak greeting in current selected language and wait for completion
    await speakAdvisoryAnswer(greeting, greetingLang);

    // Automatically start listening for farmer question after speech finishes
    if (callActiveRef.current) {
      startAdvisoryListening(greetingLang);
    }
  };

  // Process advisory question with dynamic language detection
  const handleProcessAdvisoryQuery = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return;

    setFarmerVoiceText(transcriptText);
    setGeneralQueryText(transcriptText);
    setCallState('responding');
    setLoading(true);

    // 1. Detect language from farmer's spoken transcript ONLY
    const detectedLanguage = detectSpokenLanguage(transcriptText);

    // 2. Immediately speak waiting message in detected language
    const waitingSpeech = detectedLanguage === 'te'
      ? 'దయచేసి వేచి ఉండండి. నేను మీ కోసం పరిశీలిస్తున్నాను.'
      : 'Please wait, I am checking that for you.';
    
    setIvrResponse(waitingSpeech);
    speakAdvisoryAnswer(waitingSpeech, detectedLanguage);

    // 3. Build recent conversation turns (last 2-3 turns)
    const updatedHistory = [
      ...advisoryHistory,
      { sender: 'farmer', text: transcriptText }
    ];

    try {
      const response = await fetch(`${API_URL}/api/farmer-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: transcriptText.trim(),
          language: detectedLanguage,
          conversationHistory: updatedHistory.slice(-3),
          farmerContext: {
            farmerId: 'BasicPhoneUser',
            location: 'Andhra Pradesh'
          }
        })
      });

      const data = await response.json();
      const aiAnswer = data.shortAdvisory || data.advisoryText || (
        detectedLanguage === 'te'
          ? 'మీ పంటను నిశితంగా గమనించండి. ప్రస్తుత వాతావరణానికి అనుగుణంగా సరైన చర్యలు తీసుకోండి.'
          : 'Monitor your crop carefully. Take appropriate actions based on current weather conditions.'
      );

      console.log("FULL AI ANSWER:", aiAnswer);
      console.log("ANSWER LENGTH:", aiAnswer?.length);
      console.log("DETECTED LANGUAGE:", detectedLanguage);

      setIvrResponse(aiAnswer);
      setAdvisoryHistory([
        ...updatedHistory,
        { sender: 'bhoomivani', text: aiAnswer }
      ]);

      const speechText = cleanTextForSpeech(aiAnswer);
      console.log("FULL SPEECH TEXT:", speechText);
      console.log("SPEECH LENGTH:", speechText?.length);

      // 4. Speak FULL complete answer in detected language and WAIT for completion
      await speakAdvisoryAnswer(speechText, detectedLanguage);

      // 5. Automatically listen for next question only AFTER speech ends
      if (callActiveRef.current) {
        setCallState('connected');
        startAdvisoryListening(detectedLanguage);
      }
    } catch (err) {
      console.error("Advisory query error:", err);
      const fallback = detectedLanguage === 'te'
        ? 'మీ పంటను నిశితంగా గమనించండి. వర్షం మరియు వాతావరణ పరిస్థితులకు అనుగుణంగా తగిన చర్యలు తీసుకోండి.'
        : 'Please monitor your crop carefully and check weather conditions before spraying or irrigating.';
      
      setIvrResponse(fallback);
      const fallbackSpeech = cleanTextForSpeech(fallback);
      await speakAdvisoryAnswer(fallbackSpeech, detectedLanguage);

      if (callActiveRef.current) {
        setCallState('connected');
        startAdvisoryListening(detectedLanguage);
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 2. FIRST-TIME / NEW FARMER VOICE CALL (Case Registration)
  // =====================================================
  const handleStartVoiceCall = () => {
    setCallMode('new');
    setCallActive(true);
    callActiveRef.current = true;
    setCallState('calling');
    setAnalysis(null);
    setPreviousCase(null);
    setProblemText('');
    setGeneralQueryText('');
    setFarmerVoiceText('');
    setIvrResponse('');
    setShowCropCondition(false);
    setFollowUpResult('');
    setSelectedCondition('');

    setTimeout(() => {
      setCallState('connected');
      const greeting = isTe
        ? 'భూమివాణికి స్వాగతం. మీ వ్యవసాయ సమస్య ఏమిటి?'
        : 'Welcome to BhūmiVāṇī. What is your agriculture problem?';
      setIvrResponse(greeting);
      speakAdvisoryAnswer(greeting, isTe ? 'te' : 'en');
    }, 1200);
  };

  const handleStartNewCall = () => {
    handleStartVoiceCall();
  };

  // =====================================================
  // 3. RETURNING FARMER CALL (Case Lookup)
  // =====================================================
  const handleStartReturningCall = () => {
    setCallMode('returning');
    setCallActive(true);
    callActiveRef.current = true;
    setCallState('calling');
    setFarmerId('');
    setCaseId('');
    setPreviousCase(null);
    setAnalysis(null);
    setProblemText('');
    setGeneralQueryText('');
    setFarmerVoiceText('');
    setIvrResponse('');
    setShowCropCondition(false);
    setFollowUpResult('');
    setSelectedCondition('');

    setTimeout(() => {
      setCallState('connected');
      const greeting = isTe
        ? 'భూమివాణికి తిరిగి స్వాగతం. మీ Farmer ID మరియు Case ID చెప్పండి.'
        : 'Welcome back to BhūmiVāṇī. Please tell me your Farmer ID and Case ID.';
      setIvrResponse(greeting);
      speakAdvisoryAnswer(greeting, isTe ? 'te' : 'en');
    }, 1200);
  };

  // Process problem analysis & case registration (Helpline Case Flow)
  const handleAnalyzeProblem = async (problem) => {
    if (!problem?.trim()) {
      const message = isTe
        ? 'దయచేసి మీ వ్యవసాయ సమస్యను చెప్పండి.'
        : 'Please tell me your agriculture problem.';
      setIvrResponse(message);
      await speakAdvisoryAnswer(message, isTe ? 'te' : 'en');
      return;
    }

    setFarmerVoiceText(problem);
    setLoading(true);
    setCallState('responding');
    setAnalysis(null);

    const analyzingSpeech = isTe
      ? 'భూమివాణి మీ సమస్యను విశ్లేషిస్తోంది. దయచేసి వేచి ఉండండి.'
      : 'BhūmiVāṇī is analyzing your problem. Please wait.';
    setIvrResponse(analyzingSpeech);
    await speakAdvisoryAnswer(analyzingSpeech, isTe ? 'te' : 'en');

    try {
      const aiResponse = await fetch(`${API_URL}/api/farmer-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: problem.trim(),
          language: language,
          farmerContext: {
            farmerId: farmerId || null,
            location: localStorage.getItem('farmerLocation') || '',
            crops: []
          },
          conversationHistory: []
        })
      });

      const aiData = await aiResponse.json();
      const advisory =
        aiData.shortAdvisory ||
        aiData.advisoryText ||
        aiData.answer ||
        (isTe
          ? 'ఆకుమచ్చల తెగులు ఉండవచ్చు. ప్రస్తుత వాతావరణం పరిశీలించి వర్షం తగ్గిన తర్వాత తగిన చర్యలు తీసుకోండి.'
          : 'Possible problem: Leaf spot disease. Rain probability is high. Avoid spraying now and spray after rain subsides.');

      setAnalysis(aiData);

      // Automatic case registration
      const caseResponse = await fetch(`${API_URL}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: callerPhone || '9876543210',
          farmerId: farmerId || undefined,
          caseType: 'diagnosis',
          problem: problem.trim(),
          symptoms: problem.trim(),
          description: problem.trim(),
          advisoryText: advisory,
          aiAnalysis: aiData,
          language: language
        })
      });

      const caseData = await caseResponse.json();
      const finalFarmerId = caseData.farmerId || 'BVM-F-001';
      const finalCaseId = caseData.caseId || 'BVM-C-001';

      setFarmerId(finalFarmerId);
      setCaseId(finalCaseId);

      const registrationSpeech = isTe
        ? `${advisory} మీ కేసు నమోదు అయింది. మీ Farmer ID ${finalFarmerId}. మీ Case ID ${finalCaseId}.`
        : `${advisory} Your case is registered. Your Farmer ID is ${finalFarmerId}. Your Case ID is ${finalCaseId}.`;

      setIvrResponse(registrationSpeech);
      await speakAdvisoryAnswer(registrationSpeech, isTe ? 'te' : 'en');

      setCallState('connected');
    } catch (error) {
      console.error('Farmer problem processing error:', error);
      const fallbackMsg = isTe
        ? 'మీ వ్యవసాయ సమస్య నమోదు అయింది. మీ పంటను గమనిస్తూ ఉండండి.'
        : 'Your agriculture problem has been registered. Please monitor the crop.';
      setIvrResponse(fallbackMsg);
      await speakAdvisoryAnswer(fallbackMsg, isTe ? 'te' : 'en');
      setCallState('connected');
    } finally {
      setLoading(false);
    }
  };

  // Returning Farmer Case Lookup
  const handleFindPreviousCase = async () => {
    if (!farmerId.trim() || !caseId.trim()) {
      const message = isTe
        ? 'దయచేసి మీ Farmer ID మరియు Case ID రెండింటినీ చెప్పండి.'
        : 'Please provide both your Farmer ID and Case ID.';
      setIvrResponse(message);
      await speakAdvisoryAnswer(message, isTe ? 'te' : 'en');
      return;
    }

    setLoading(true);
    setCallState('responding');

    try {
      const response = await fetch(
        `${API_URL}/api/cases/${encodeURIComponent(farmerId.trim())}/${encodeURIComponent(caseId.trim())}`
      );
      const data = await response.json();

      if (!response.ok || !data.case) {
        throw new Error(data.message || 'Case not found');
      }

      const retrievedCase = data.case;
      setPreviousCase(retrievedCase);

      const cropName = retrievedCase.crop || (isTe ? 'పంట' : 'crop');
      const issueSummary = retrievedCase.problem || retrievedCase.symptoms || (isTe ? 'సమస్య' : 'issue');

      const message = isTe
        ? `${cropName} పంటకు సంబంధించిన మీ కేసును కనుగొన్నాను. గత నివేదిక నుండి పంట పరిస్థితి ఎలా ఉంది? నష్టం పెరిగిందా లేదా తగ్గిందా?`
        : `I found your ${cropName} case regarding ${issueSummary}. Has the leaf damage increased or improved since your last report?`;

      setIvrResponse(message);
      await speakAdvisoryAnswer(message, isTe ? 'te' : 'en');

      setShowCropCondition(true);
      setCallState('connected');
    } catch (error) {
      console.error('Find case validation error:', error);
      const message = isTe
        ? 'ఆ కేసు కనుగొనలేకపోయాను. దయచేసి మీ Farmer ID మరియు Case IDని సరిచూడండి.'
        : 'I could not find that case. Please check your Farmer ID and Case ID.';
      setIvrResponse(message);
      await speakAdvisoryAnswer(message, isTe ? 'te' : 'en');
      setCallState('connected');
    } finally {
      setLoading(false);
    }
  };

  // Follow-up condition response
  const handleCropCondition = async (condition) => {
    if (!previousCase || followUpLoading) return;

    setSelectedCondition(condition);
    setFollowUpLoading(true);
    setCallState('responding');

    let defaultMsg = '';
    if (condition === 'improved') {
      defaultMsg = isTe
        ? 'మీ పంట పరిస్థితి మెరుగుపడిందని తెలుసుకోవడం ఆనందంగా ఉంది. ప్రస్తుతం సూచించిన చర్యలను కొనసాగించండి.'
        : 'The crop condition has improved. Continue the recommended regimen and monitor regularly.';
    } else if (condition === 'worse') {
      defaultMsg = isTe
        ? 'ఆకుల నష్టం పెరిగింది. తేమ ఎక్కువగా ఉంది కాబట్టి తెగులు వ్యాప్తి చెందే అవకాశం ఉంది. వర్షం ముందు మందులు పిచికారీ చేయవద్దు.'
        : 'The leaf damage has increased. Humidity is high so fungal spread may continue. Avoid spraying before rain.';
    } else {
      defaultMsg = isTe
        ? 'పంట పరిస్థితిలో మార్పు లేదు. వాతావరణాన్ని గమనిస్తూ ఉండండి మరియు అనుకూల సమయంలో మాత్రమే చర్యలు తీసుకోండి.'
        : 'Condition unchanged. Monitor the weather and apply treatments only during dry conditions.';
    }

    try {
      const response = await fetch(
        `${API_URL}/api/cases/${encodeURIComponent(previousCase.caseId)}/continue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progressChoice: condition,
            language: language
          })
        }
      );

      const data = await response.json();
      const finalMsg = data.message || defaultMsg;
      setIvrResponse(finalMsg);
      setFollowUpResult(finalMsg);
      await speakAdvisoryAnswer(finalMsg, isTe ? 'te' : 'en');

      if (response.ok && data.updatedCase) {
        setPreviousCase(data.updatedCase);
      }
    } catch (error) {
      console.error('Follow-up update error:', error);
      setIvrResponse(defaultMsg);
      setFollowUpResult(defaultMsg);
      await speakAdvisoryAnswer(defaultMsg, isTe ? 'te' : 'en');
    }

    setShowCropCondition(false);
    setCallState('connected');
    setFollowUpLoading(false);
  };

  // End call handler
  const handleEndCall = () => {
    setCallActive(false);
    callActiveRef.current = false;
    setCallState('idle');
    setIsListening(false);
    setIvrResponse('');
    setFarmerVoiceText('');
    setProblemText('');
    setGeneralQueryText('');
    setAnalysis(null);
    setPreviousCase(null);
    setShowCropCondition(false);
    setFollowUpResult('');
    setSelectedCondition('');
    setAdvisoryHistory([]);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
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
  };

  const resetDemo = () => {
    handleEndCall();
    setFarmerId('');
    setCaseId('');
    setLoading(false);
    setFollowUpLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* TITLE */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Basic Phone AI Voice Service</span>
        </div>
        <h1 className="text-3xl font-extrabold text-deepforest">{t('ivrTitle')}</h1>
        <p className="text-sm text-slate-600">{t('ivrSub')}</p>
      </div>

      {/* PROMINENT BASIC PHONE ADVISORY CARD */}
      <div className="bg-gradient-to-r from-deepforest via-emerald-900 to-deepforest-light text-white rounded-3xl p-6 shadow-xl border-2 border-agri-400/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Basic Phone Advisory Voice System</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              Basic Phone Advisory ({isTe ? 'వ్యవసాయ సలహా కాల్' : 'Agriculture Advisory Call'})
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90">
              "Ask any farming or weather question naturally in Telugu or English for immediate AI voice advice."
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleStartAdvisoryCall}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>📞 {isTe ? 'సలహా కాల్ ప్రారంభించండి' : 'Start Advisory Call'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLOW OVERVIEW */}
      <div className="agri-card p-6">
        <h3 className="font-bold text-deepforest mb-4">📞 BhūmiVāṇī Farmer Voice Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center text-xs font-bold">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-2xl mb-1">📞</div>
            Start Call
          </div>
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight />
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-2xl mb-1">🎤</div>
            Ask / Speak
          </div>
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight />
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-2xl mb-1">🤖</div>
            Analyzing & Advice
          </div>
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight />
          </div>
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
            <div className="text-2xl mb-1">🔁</div>
            Next Question
          </div>
        </div>
      </div>

      {/* CALL BUTTONS & CALLER PHONE SELECTOR */}
      {!callActive && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <span>📱 Simulated Caller Phone Number:</span>
              <input
                type="text"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-sm w-36"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCallerPhone('9876543210')}
                className="text-emerald-700 font-medium hover:underline"
              >
                Phone A (9876543210)
              </button>
              <button
                type="button"
                onClick={() => setCallerPhone('9123456780')}
                className="text-sky-700 font-medium hover:underline"
              >
                Phone B (9123456780)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleStartAdvisoryCall}
              className="p-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg text-left"
            >
              📞 Start Advisory Call
              <span className="block text-xs font-normal mt-1 opacity-90">
                General agriculture Q&A (Weather, spray, crops)
              </span>
            </button>

            <button
              onClick={handleStartNewCall}
              className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg text-left"
            >
              📋 Problem Case Helpline
              <span className="block text-xs font-normal mt-1 opacity-90">
                Diagnose disease & auto-register case ID
              </span>
            </button>

            <button
              onClick={handleStartReturningCall}
              className="p-5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg text-left"
            >
              🔄 Returning Farmer Lookup
              <span className="block text-xs font-normal mt-1 opacity-90">
                Lookup existing case with Farmer ID + Case ID
              </span>
            </button>
          </div>
        </div>
      )}

      {/* CALL AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PHONE EMULATOR */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-600/30 text-emerald-400 mx-auto flex items-center justify-center">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mt-2">Toll-Free: 1800-BHUMI</h3>
            <p className="text-xs text-slate-400">Caller: {callerPhone || 'Unknown'}</p>
          </div>

          {/* SCREEN */}
          <div className="min-h-60 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-center text-center">
            {callState === 'idle' && (
              <p className="text-xs text-emerald-300">Choose a call type above.</p>
            )}

            {callState === 'calling' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-amber-300 animate-pulse">
                  📞 Connecting to BhūmiVāṇī...
                </p>
                <p className="text-xs text-slate-400">Please wait</p>
              </div>
            )}

            {(callState === 'connected' || callState === 'listening' || callState === 'responding') && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold animate-pulse">
                    CALL LIVE
                  </span>
                  {callState === 'listening' && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold animate-bounce">
                      🎙️ LISTENING
                    </span>
                  )}
                  {callMode === 'advisory' && (
                    <span className="text-[10px] bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
                      ADVISORY
                    </span>
                  )}
                </div>

                <p className="text-sm text-emerald-200 font-medium leading-6 whitespace-pre-line">
                  {ivrResponse}
                </p>

                {loading && (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-300 animate-pulse">
                      🤖 BhūmiVāṇī is checking that for you...
                    </p>
                    <div className="w-full bg-emerald-900 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full animate-pulse w-2/3" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {callActive && (
            <button
              onClick={handleEndCall}
              className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <PhoneOff />
              End Call
            </button>
          )}
        </div>

        {/* RIGHT SIDE INPUT CHANNELS */}
        <div className="agri-card p-6 space-y-5">
          
          {/* ADVISORY CALL INPUT */}
          {callMode === 'advisory' && (
            <>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">🌾 Basic Phone Advisory Voice Input</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Ask any question about weather, crops, spraying, irrigation, or pests in Telugu or English.
                </p>
              </div>

              <textarea
                value={generalQueryText}
                onChange={(e) => setGeneralQueryText(e.target.value)}
                disabled={!callActive || loading}
                placeholder="Example: Will it rain today? / ఈరోజు వర్షం పడుతుందా?"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none"
                rows="3"
              />

              <div className="flex gap-2">
                <button
                  disabled={!callActive || loading || !generalQueryText.trim()}
                  onClick={() => handleProcessAdvisoryQuery(generalQueryText)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold disabled:opacity-50"
                >
                  <Sparkles className="inline w-4 h-4 mr-2" />
                  Ask Question
                </button>
                <button
                  disabled={!callActive || loading}
                  onClick={() => startAdvisoryListening(detectSpokenLanguage(generalQueryText))}
                  className={`px-4 py-3 rounded-xl font-bold text-xs ${
                    isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                  title="Speak via Microphone"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* QUICK ADVISORY SAMPLES */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold text-slate-600 mb-2">🎤 Quick Voice Question Samples</p>

                <button
                  disabled={!callActive || loading}
                  onClick={() => handleProcessAdvisoryQuery('Will it rain today?')}
                  className="w-full text-left p-2.5 rounded-xl border bg-slate-50 hover:bg-amber-50 text-xs font-medium disabled:opacity-50 mb-2"
                >
                  <Mic className="inline w-3.5 h-3.5 mr-2 text-agri-600" />
                  "Will it rain today?" (English)
                </button>

                <button
                  disabled={!callActive || loading}
                  onClick={() => handleProcessAdvisoryQuery('ఈరోజు వర్షం పడుతుందా?')}
                  className="w-full text-left p-2.5 rounded-xl border bg-slate-50 hover:bg-amber-50 text-xs font-medium disabled:opacity-50 mb-2"
                >
                  <Mic className="inline w-3.5 h-3.5 mr-2 text-agri-600" />
                  "ఈరోజు వర్షం పడుతుందా?" (Telugu)
                </button>

                <button
                  disabled={!callActive || loading}
                  onClick={() => handleProcessAdvisoryQuery('ఈరోజు chilli crop కి spray చేయవచ్చా?')}
                  className="w-full text-left p-2.5 rounded-xl border bg-slate-50 hover:bg-amber-50 text-xs font-medium disabled:opacity-50"
                >
                  <Mic className="inline w-3.5 h-3.5 mr-2 text-agri-600" />
                  "ఈరోజు chilli crop కి spray చేయవచ్చా?" (Mixed Telugu-English)
                </button>
              </div>

              {farmerVoiceText && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong>Farmer said:</strong>
                  <p className="mt-1">"{farmerVoiceText}"</p>
                </div>
              )}
            </>
          )}

          {/* NEW CASE REGISTRATION INPUT */}
          {callMode === 'new' && (
            <>
              <div>
                <h3 className="font-bold text-deepforest text-lg">👨‍🌾 Problem Case Registration</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Describe your agricultural problem. BhūmiVāṇī will diagnose the problem and automatically assign your Case ID.
                </p>
              </div>

              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                disabled={!callActive || loading}
                placeholder="Example: My chilli plants have yellow leaves and brown spots."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none"
                rows="4"
              />

              <button
                disabled={!callActive || loading || !problemText.trim()}
                onClick={() => handleAnalyzeProblem(problemText)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                <Sparkles className="inline w-4 h-4 mr-2" />
                Analyze Problem & Register Case
              </button>

              <div className="border-t pt-4">
                <p className="text-xs font-bold text-slate-600 mb-2">🎤 Problem Voice Samples</p>
                <button
                  disabled={!callActive || loading}
                  onClick={() => handleAnalyzeProblem(isTe ? 'నా మిరప ఆకులపై చిన్న గోధుమ మచ్చలు వచ్చాయి.' : 'My chilli plants have yellow leaves and brown spots.')}
                  className="w-full text-left p-3 rounded-xl border bg-slate-50 text-xs font-medium disabled:opacity-50 mb-2"
                >
                  <Mic className="inline w-4 h-4 mr-2 text-agri-600" />
                  {isTe ? 'నా మిరప ఆకులపై చిన్న గోధుమ మచ్చలు వచ్చాయి.' : 'My chilli plants have yellow leaves and brown spots.'}
                </button>
              </div>

              {farmerVoiceText && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong>You said:</strong>
                  <p className="mt-1">"{farmerVoiceText}"</p>
                </div>
              )}
            </>
          )}

          {/* RETURNING FARMER LOOKUP */}
          {callMode === 'returning' && (
            <>
              <div>
                <h3 className="font-bold text-sky-900 text-lg">🔄 Returning Farmer Case Lookup</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Enter or speak the Farmer ID and Case ID received during your previous call.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Farmer ID</label>
                <div className="relative mt-1">
                  <UserRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    value={farmerId}
                    onChange={(e) => setFarmerId(e.target.value.toUpperCase())}
                    placeholder="e.g. BVM-F-001"
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Case ID</label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value.toUpperCase())}
                    placeholder="e.g. BVM-C-001"
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <button
                disabled={!callActive || loading || !farmerId || !caseId}
                onClick={handleFindPreviousCase}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                <Search className="inline w-4 h-4 mr-2" />
                Retrieve Previous Case
              </button>

              <div className="border-t pt-3">
                <p className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Demo Fill</p>
                <button
                  type="button"
                  onClick={() => {
                    setFarmerId('BVM-F-001');
                    setCaseId('BVM-C-001');
                  }}
                  className="text-xs text-sky-600 hover:underline mr-4"
                >
                  Fill Demo: BVM-F-001 / BVM-C-001
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFarmerId('BVM-F-999');
                    setCaseId('BVM-C-999');
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Test Invalid IDs
                </button>
              </div>

              {showCropCondition && previousCase && (
                <div className="border-t pt-5">
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 mb-4">
                    <p className="text-sm font-bold text-sky-900">
                      🌾 {isTe ? 'పంట పరిస్థితి ఎలా ఉంది?' : 'Has the crop condition improved, unchanged, or worsened?'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {isTe
                        ? 'దయచేసి మీ ప్రస్తుత పరిస్థితిని ఎంచుకోండి.'
                        : 'Select or say the option that best describes your current crop condition.'}
                    </p>
                  </div>

                  <button
                    disabled={followUpLoading}
                    onClick={() => handleCropCondition('improved')}
                    className="w-full p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left mb-3 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <ThumbsUp className="text-emerald-600" />
                      <div>
                        <p className="font-bold text-emerald-900">
                          {isTe ? 'పంట మెరుగుపడింది' : 'Improved / Damage Reduced'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {isTe ? 'సమస్య తగ్గుతోంది' : 'The crop condition is getting better'}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    disabled={followUpLoading}
                    onClick={() => handleCropCondition('same')}
                    className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left mb-3 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <MinusCircle className="text-amber-600" />
                      <div>
                        <p className="font-bold text-amber-900">
                          {isTe ? 'మార్పు లేదు' : 'Same / Unchanged'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {isTe ? 'గత నివేదికతో పోలిస్తే మార్పు లేదు' : 'No major difference from last report'}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    disabled={followUpLoading}
                    onClick={() => handleCropCondition('worse')}
                    className="w-full p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="text-red-600" />
                      <div>
                        <p className="font-bold text-red-900">
                          {isTe ? 'పరిస్థితి తీవ్రమైంది' : 'Worse / Leaf Damage Increased'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {isTe ? 'మచ్చలు లేదా తెగులు మరింత పెరిగింది' : 'Lesions or wilting spreading further'}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}