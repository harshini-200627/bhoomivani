import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

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

  // Text-to-Speech (TTS) helper function
  const speakText = (text, customLang = null) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous playback

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = customLang || (language === 'te' ? 'te-IN' : 'en-US');
    utterance.lang = targetLang;
    utterance.rate = 0.9; // Slightly slower pace for clarity

    // Try to find matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.includes(targetLang) || v.lang.includes(targetLang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speakText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
