import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';
import API_URL from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('bv_lang') || 'te'; // Default to Telugu as per specification
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('bv_lang', lang);
  };

  const t = (key) => {
    if (!translations[language]) return translations.en[key] || key;
    return translations[language][key] || translations.en[key] || key;
  };

  // Text-to-Speech (TTS) helper function with Guaranteed Native Telugu Audio
  const speakText = (text, customLang = null) => {
    if (!text || !text.trim()) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const isTextTelugu = /[\u0C00-\u0C7F]/.test(text) || customLang === 'te' || language === 'te';

    if (isTextTelugu) {
      try {
        const audioUrl = `${API_URL}/api/tts?lang=te&text=${encodeURIComponent(text.trim())}`;
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {
          fallbackWebSpeech(text, 'te-IN');
        });
        return;
      } catch (e) {
        fallbackWebSpeech(text, 'te-IN');
        return;
      }
    }

    fallbackWebSpeech(text, 'en-US');
  };

  const fallbackWebSpeech = (text, langCode) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode.split('-')[0]));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speakText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
