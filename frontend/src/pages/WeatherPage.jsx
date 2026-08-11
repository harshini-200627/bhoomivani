import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CloudSun, CloudRain, Wind, Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function WeatherPage() {
  const { t, language } = useLanguage();
  const isTe = language === 'te';

  const [weather, setWeather] = useState({
    temperature: "31°C",
    humidity: "78%",
    rainProbability: "35%",
    windSpeed: "12 km/h",
    locationName: "Vijayawada, Andhra Pradesh",
    spraySuitability: "Caution",
    weatherWarningTe: "రాబోయే 24 గంటల్లో వర్షాపాతం లేదా తేమ మారే అవకాశం ఉంది. వాతావరణం పరిశీలించిన తర్వాత పిచికారీ చేయండి.",
    weatherWarningEn: "Variations in rain probability detected within 24h. Verify field conditions before chemical application."
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/weather');
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.log("Using cached weather data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{weather.locationName}</span>
          </div>
          <h1 className={`text-3xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
            🌦️ What the Weather Means for Your Crop
          </h1>
          <p className={`text-sm text-slate-600 ${isTe ? 'te-text' : ''}`}>
            {isTe ? "పంటల రక్షణ మరియు పిచికారీ కోసం స్థానిక వాతావరణ సమాచారం." : "Local agricultural microclimate insights tailored for field decision support."}
          </p>
        </div>

        <button
          onClick={fetchWeatherData}
          className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Weather</span>
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="agri-card p-5 space-y-2 text-center">
          <CloudSun className="w-8 h-8 text-amber-500 mx-auto" />
          <span className="text-xs text-slate-500 font-semibold uppercase block">Temperature</span>
          <span className="text-2xl font-extrabold text-slate-900">{weather.temperature}</span>
        </div>

        <div className="agri-card p-5 space-y-2 text-center">
          <Droplets className="w-8 h-8 text-sky-500 mx-auto" />
          <span className="text-xs text-slate-500 font-semibold uppercase block">Humidity</span>
          <span className="text-2xl font-extrabold text-slate-900">{weather.humidity}</span>
        </div>

        <div className="agri-card p-5 space-y-2 text-center">
          <CloudRain className="w-8 h-8 text-indigo-500 mx-auto" />
          <span className="text-xs text-slate-500 font-semibold uppercase block">Rain Chance</span>
          <span className="text-2xl font-extrabold text-slate-900">{weather.rainProbability}</span>
        </div>

        <div className="agri-card p-5 space-y-2 text-center">
          <Wind className="w-8 h-8 text-teal-500 mx-auto" />
          <span className="text-xs text-slate-500 font-semibold uppercase block">Wind Speed</span>
          <span className="text-2xl font-extrabold text-slate-900">{weather.windSpeed}</span>
        </div>

      </div>

      {/* SPRAY SUITABILITY DECISION BANNER */}
      <div className={`p-8 rounded-3xl border-2 space-y-4 shadow-xl ${
        weather.spraySuitability === 'Favorable' 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : weather.spraySuitability === 'Unfavorable'
          ? 'bg-red-50 border-red-300 text-red-950'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center space-x-3">
          {weather.spraySuitability === 'Favorable' ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          )}
          <div>
            <h2 className={`text-xl font-extrabold ${isTe ? 'te-text' : ''}`}>
              Field Operations Suitability: <span className="underline">{weather.spraySuitability}</span>
            </h2>
            <p className={`text-sm mt-1 ${isTe ? 'te-text' : ''}`}>
              {isTe ? weather.weatherWarningTe : weather.weatherWarningEn}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
