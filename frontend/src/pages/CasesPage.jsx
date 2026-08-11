import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import VoiceRecorder from '../components/VoiceRecorder';
import { FolderKanban, Activity, CheckCircle2, ArrowRight, MessageSquare, Mic, AlertCircle, RefreshCw, Calendar, Tag } from 'lucide-react';

export default function CasesPage() {
  const { t, language, speakText } = useLanguage();
  const { farmer, activeCase, updateActiveCase } = useFarmer();
  const isTe = language === 'te';

  const [casesList, setCasesList] = useState([
    {
      caseId: "CASE-BV-7821",
      farmerId: "BV-2847",
      crop: "Chilli (మిరప)",
      problemTitle: "Leaf Spot Symptoms / ఆకుల మచ్చల సమస్య",
      symptoms: "Small dark circular spots appearing on lower leaves, mild yellowing",
      status: "Monitoring",
      createdAt: "2026-08-10",
      aiAnalysis: {
        possibleIssue: isTe ? "నల్ల మచ్చల తెగులు (Cercospora Leaf Spot)" : "Cercospora Leaf Spot",
        actionTiming: isTe ? "🟡 వాతావరణం పిచికారీ చేయడానికి సిద్ధంగా లేదు" : "🟡 Weather caution active"
      }
    },
    {
      caseId: "CASE-BV-7932",
      farmerId: "BV-2847",
      crop: "Rice (వరి)",
      problemTitle: "Pest concern / ఆకు ఎండ తెగులు",
      symptoms: "Discolored yellowing leaf blade tips",
      status: "Resolved",
      createdAt: "2026-08-05",
      aiAnalysis: {
        possibleIssue: isTe ? "వరి ఆకు ఎండ తెగులు (Bacterial Blight)" : "Bacterial Blight",
        actionTiming: isTe ? "🟢 అనుకూల పరిస్థితి" : "🟢 Resolved"
      }
    }
  ]);

  const [selectedCase, setSelectedCase] = useState(casesList[0]);
  const [continuationChoice, setContinuationChoice] = useState(null);
  const [continuationVoiceNote, setContinuationVoiceNote] = useState('');
  const [updatedMessage, setUpdatedMessage] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch(`/api/cases?farmerId=${farmer.farmerId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCasesList(data);
          setSelectedCase(data[0]);
        }
      }
    } catch (e) {
      console.log("Using cached cases list");
    }
  };

  const handleCaseFollowup = async (choice) => {
    setContinuationChoice(choice);
    
    let message = "";
    if (choice === 'improved') {
      message = isTe 
        ? "మంచి పరిణామం! పొలంలో నిలిచిన నీటిని తీసివేసి అదే నిర్వహణను కొనసాగించండి." 
        : "Great news! Continue maintaining proper field aeration and moisture control.";
    } else if (choice === 'worse') {
      message = isTe 
        ? "హెచ్చరిక: సమస్య పెరిగినందున వెంటనే మీ గ్రామ వ్యవసాయ విస్తరణాధికారిని (AEO) నేరుగా సంప్రదించండి." 
        : "Warning: Condition has escalated. Please contact your local Agricultural Extension Officer (AEO) immediately.";
    } else {
      message = isTe 
        ? "పరిస్థితి స్థిరంగా ఉంది. తదుపరి 24 గంటలు ఆకుల పరిమాణాన్ని పరిశీలిస్తూ ఉండండి." 
        : "Condition remains unchanged. Continue observing leaf symptoms for the next 24 hours.";
    }

    setUpdatedMessage(message);

    // Update case in state
    const updated = {
      ...selectedCase,
      status: choice === 'improved' ? 'Improving' : choice === 'worse' ? 'Escalated' : 'Monitoring',
      updatedAt: new Date().toISOString(),
      updatedMessage: message
    };

    setSelectedCase(updated);
    updateActiveCase(updated);
    setCasesList(prev => prev.map(c => c.caseId === updated.caseId ? updated : c));

    // Optional TTS audio read
    speakText(message);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* HEADER */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className={`text-3xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
          📋 My Agricultural Cases (నా వ్యవసాయ కేస్‌లు)
        </h1>
        <p className={`text-sm text-slate-600 ${isTe ? 'te-text' : ''}`}>
          Continue existing crop discussions without having to re-enter your information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CASE LIST COLUMN */}
        <div className="space-y-4">
          <h2 className={`font-bold text-slate-700 text-sm uppercase ${isTe ? 'te-text' : ''}`}>
            Case Records
          </h2>
          <div className="space-y-3">
            {casesList.map(c => (
              <button
                key={c.caseId}
                onClick={() => { setSelectedCase(c); setContinuationChoice(null); setUpdatedMessage(''); }}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedCase?.caseId === c.caseId
                    ? 'bg-deepforest text-white shadow-xl border-deepforest-light scale-102'
                    : 'agri-card hover:border-agri-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono opacity-80">{c.caseId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'Resolved' ? 'bg-emerald-200 text-emerald-950' :
                    c.status === 'Escalated' ? 'bg-red-200 text-red-950' : 'bg-amber-200 text-amber-950'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <h3 className={`font-extrabold text-base mt-2 ${selectedCase?.caseId === c.caseId ? 'text-white' : 'text-deepforest'} ${isTe ? 'te-text' : ''}`}>
                  {c.crop}
                </h3>
                <p className={`text-xs mt-1 line-clamp-2 ${selectedCase?.caseId === c.caseId ? 'text-emerald-100' : 'text-slate-600'} ${isTe ? 'te-text' : ''}`}>
                  {c.problemTitle || c.symptoms}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* CASE CONTINUITY DETAIL COLUMN */}
        {selectedCase && (
          <div className="lg:col-span-2 agri-card p-6 sm:p-8 space-y-6 shadow-xl border-2 border-agri-400">
            
            {/* Case Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                  {selectedCase.caseId}
                </span>
                <h2 className={`text-2xl font-extrabold text-deepforest mt-2 ${isTe ? 'te-text' : ''}`}>
                  {selectedCase.crop} — {selectedCase.problemTitle}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="text-sm font-bold text-agri-700">{selectedCase.status}</span>
              </div>
            </div>

            {/* CASE CONTINUATION AI PROMPT */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-deepforest text-white rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center space-x-2 text-amber-300">
                <MessageSquare className="w-5 h-5" />
                <h3 className={`font-bold text-base ${isTe ? 'te-text' : ''}`}>
                  BhūmiVāṇī Case Continuity (కేస్ అనుసంధానం)
                </h3>
              </div>

              <p className={`text-lg font-bold text-emerald-100 ${isTe ? 'te-text' : ''}`}>
                {isTe 
                  ? `"${selectedCase.crop} లో ఆకుల సమస్య గురించి మళ్లీ మాట్లాడుతున్నారా?"` 
                  : `"Are you continuing the discussion regarding your ${selectedCase.crop} leaf issue?"`}
              </p>

              <p className={`text-sm text-emerald-200/90 font-medium ${isTe ? 'te-text' : ''}`}>
                {isTe ? "మునుపటితో పోలిస్తే ఈ రోజు సమస్య ఎలా ఉంది?" : "Compared to yesterday, how is the crop condition today?"}
              </p>

              {/* Continuation Visual Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => handleCaseFollowup('improved')}
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-all text-center"
                >
                  🟢 Improved (మెరుగుపడింది)
                </button>
                <button
                  onClick={() => handleCaseFollowup('same')}
                  className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all text-center"
                >
                  🟡 Same (అలాగే ఉంది)
                </button>
                <button
                  onClick={() => handleCaseFollowup('worse')}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all text-center"
                >
                  🔴 Worse (సమస్య పెరిగింది)
                </button>
              </div>
            </div>

            {/* Continuation Response Alert */}
            {updatedMessage && (
              <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-2">
                <h4 className={`font-bold text-amber-900 text-sm ${isTe ? 'te-text' : ''}`}>
                  💡 BhūmiVāṇī Updated Guidance:
                </h4>
                <p className={`text-sm text-slate-800 font-medium ${isTe ? 'te-text' : ''}`}>
                  {updatedMessage}
                </p>
              </div>
            )}

            {/* Original Symptoms & AI Analysis Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className={`font-bold text-deepforest text-base ${isTe ? 'te-text' : ''}`}>
                Original Diagnosis History
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700 border">
                <p><span className="font-bold">Possible Issue:</span> {selectedCase.aiAnalysis?.possibleIssue}</p>
                <p><span className="font-bold">Original Symptoms:</span> {selectedCase.symptoms}</p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
