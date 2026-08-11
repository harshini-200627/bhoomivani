# 🌾 BhūmiVāṇī (भूमिवाणी) — "When the Land Speaks, We Listen."

**BhūmiVāṇī** is an AI-powered agricultural decision-support web platform designed for farmers with varying levels of digital literacy. It converts crop imagery, voice input, local language (Telugu & English), location, weather signals, and case history into simple, actionable agricultural guidance.

---

## 🚀 Key Features

1. **Multilingual First (Telugu & English)**: Complete UI, questions, options, advisories, and Web Speech API (Speech-to-Text & Text-to-Speech) adapt to the farmer's preferred language.
2. **Multimodal Input (Show / Speak / Type)**: Farmers can upload a crop photo, speak in Telugu or English, or optionally type their query.
3. **Adaptive AI Questioning**: Eliminates long static forms by asking a single, highly relevant visual question (e.g. *"How long have you noticed this problem?"*).
4. **Weather-Aware Decision Support**: Integrates live Open-Meteo regional weather forecasts to classify action timing into:
   - 🟢 **Favorable conditions**
   - 🟡 **Consider weather conditions**
   - 🔴 **Wait / Reassess**
5. **Case Memory & Continuity**: Every problem is assigned a unique case ID (`CASE-BV-7821`). Returning farmers can track and continue previous crop cases without re-entering history.
6. **Basic Phone / IVR Simulator**: Demonstrates how non-smartphone users can access the same AI backend via voice phone calls.

---

## 🛠️ Project Structure & Tech Stack

- **Frontend**: Vite + React + Tailwind CSS + Lucide Icons + Web Speech API (`frontend/`)
- **Backend**: Node.js + Express (`backend/`)
- **Weather API**: Open-Meteo API (Free, keyless live forecast)
- **AI Diagnostic Engine**: Multimodal Gemini / Localized expert rule engine (`backend/services/aiService.js`)

---

## 💻 How to Run Locally

### 1. Start Backend API
```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
# App will run on http://localhost:3000
```

---

## 👨‍🌾 Demo Farmer Credentials

- **Name**: Demo Farmer (రైతు సోదరుడు)
- **Farmer ID**: `BV-2847`
- **Location**: Vijayawada, Andhra Pradesh
- **Crops**: Chilli (మిరప), Rice (వరి)
