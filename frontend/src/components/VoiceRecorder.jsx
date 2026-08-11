import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VoiceRecorder({ onTranscriptChange, currentTranscript = '' }) {
  const { language, t } = useLanguage();
  const isTe = language === 'te';

  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | listening | processing | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = isTe ? 'te-IN' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscriptChange((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
          setStatus('success');
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setStatus('error');
        setErrorMessage(t('micError'));
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognition) {
      alert(isTe ? "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. టైప్ చేయండి." : "Speech recognition is not supported in this browser. Please type.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setStatus('idle');
    } else {
      setErrorMessage('');
      try {
        recognition.lang = isTe ? 'te-IN' : 'en-US';
        recognition.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-4 shadow-sm">
        
        {/* Large Accessible Microphone Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${
              isListening
                ? 'bg-red-600 mic-active scale-105'
                : 'bg-agri-600 hover:bg-agri-700 hover:scale-105'
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="space-y-1">
          <p className={`text-base font-bold ${isListening ? 'text-red-600 animate-pulse' : 'text-deepforest'} ${isTe ? 'te-text' : ''}`}>
            {isListening ? t('micListening') : t('micReady')}
          </p>
          <p className="text-xs text-slate-500">
            Language: <span className="font-bold text-amber-900">{isTe ? 'తెలుగు (te-IN)' : 'English (en-US)'}</span>
          </p>
        </div>

        {/* Error message */}
        {status === 'error' && (
          <div className="flex items-center justify-center space-x-2 text-xs text-red-600 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
