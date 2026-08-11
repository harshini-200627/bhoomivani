import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmer } from '../context/FarmerAuthContext';
import { User, Phone, MapPin, Globe, Sprout, CheckCircle2, Edit3, Save } from 'lucide-react';

export default function ProfilePage() {
  const { t, language, setLanguage } = useLanguage();
  const { farmer, updateFarmer } = useFarmer();
  const isTe = language === 'te';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: farmer.name,
    phone: farmer.phone,
    location: farmer.location,
    preferredLanguage: farmer.preferredLanguage
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateFarmer(formData);
    setLanguage(formData.preferredLanguage);
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      <div className="agri-card p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-deepforest text-white flex items-center justify-center text-3xl font-extrabold shadow-md">
              👨‍🌾
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full mb-1">
                {t('demoBadge')}
              </div>
              <h1 className={`text-2xl font-extrabold text-deepforest ${isTe ? 'te-text' : ''}`}>
                {t('profileTitle')}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Farmer ID */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border">
              <label className="text-xs font-bold text-slate-500 uppercase block">Farmer ID</label>
              <div className="text-xl font-extrabold font-mono text-deepforest">{farmer.farmerId}</div>
            </div>

            {/* Language Selection */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border">
              <label className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5" />
                <span>{t('langLabel')}</span>
              </label>
              {isEditing ? (
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm font-bold bg-white"
                >
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="en">English</option>
                </select>
              ) : (
                <div className="text-lg font-bold text-slate-800">
                  {farmer.preferredLanguage === 'te' ? 'తెలుగు (Telugu)' : 'English'}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border">
              <label className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>{t('nameLabel')}</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm font-bold bg-white"
                />
              ) : (
                <div className="text-lg font-bold text-slate-800">{farmer.name}</div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border">
              <label className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{t('phoneLabel')}</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm font-bold bg-white"
                />
              ) : (
                <div className="text-lg font-bold font-mono text-slate-800">{farmer.phone}</div>
              )}
            </div>

            {/* Location */}
            <div className="sm:col-span-2 space-y-1 bg-slate-50 p-4 rounded-xl border">
              <label className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('locationLabel')}</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm font-bold bg-white"
                />
              ) : (
                <div className="text-lg font-bold text-slate-800">{farmer.location}</div>
              )}
            </div>

          </div>

          {/* Crops */}
          <div className="space-y-2 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200">
            <label className="text-xs font-bold text-emerald-900 uppercase block flex items-center space-x-1">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <span>{t('cropsLabel')}</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {farmer.crops.map((crop, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm">
                  🌾 {crop}
                </span>
              ))}
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              className="w-full py-3 bg-agri-500 hover:bg-agri-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Save Profile Changes</span>
            </button>
          )}

        </form>

      </div>

    </div>
  );
}
