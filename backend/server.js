const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getAgriculturalWeather } = require('./services/weatherService');
const { analyzeCropProblem } = require('./services/aiService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-Memory Case Store (with pre-seeded demo cases)
let casesStore = [
  {
    caseId: "CASE-BV-7821",
    farmerId: "BV-2847",
    crop: "Chilli (మిరప)",
    symptoms: "Leaf spots and mild curling / ఆకులపై మచ్చలు మరియు ముడత",
    aiAnalysis: {
      possibleIssue: "నల్ల మచ్చల తెగులు (Cercospora Leaf Spot)",
      confidence: "Moderate",
      actionTimingStatus: "caution"
    },
    weatherContext: "Rain probability: 35%, Humidity: 78%",
    status: "Monitoring",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    caseId: "CASE-BV-7932",
    farmerId: "BV-2847",
    crop: "Rice (వరి)",
    symptoms: "Yellowing tip on paddy blades",
    aiAnalysis: {
      possibleIssue: "వరి ఆకు ఎండ తెగులు (Bacterial Leaf Blight)",
      confidence: "High",
      actionTimingStatus: "favorable"
    },
    weatherContext: "Rain probability: 10%, Humidity: 65%",
    status: "Resolved",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

let farmerProfile = {
  farmerId: "BV-2847",
  name: "Demo Farmer (రైతు సోదరుడు)",
  phone: "+91 98765 43210",
  preferredLanguage: "te",
  location: "Vijayawada, Andhra Pradesh",
  crops: ["Chilli", "Rice"]
};

// --- ROUTES ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BhūmiVāṇī Backend API', timestamp: new Date().toISOString() });
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const weather = await getAgriculturalWeather(lat, lon);
  res.json(weather);
});

// AI Crop Analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { crop, description, image, language, lat, lon } = req.body;
    
    // Fetch live weather context
    const weather = await getAgriculturalWeather(lat, lon);
    
    // Process AI diagnosis
    const analysis = await analyzeCropProblem({
      crop,
      description,
      imageProvided: !!image,
      language: language || 'te',
      weather
    });

    res.json({
      success: true,
      crop,
      weather,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      success: false,
      message: "We couldn't analyze this right now. Please try again or describe the problem using voice."
    });
  }
});

// Get Cases
app.get('/api/cases', (req, res) => {
  const { farmerId } = req.query;
  const filtered = farmerId 
    ? casesStore.filter(c => c.farmerId === farmerId)
    : casesStore;
  res.json(filtered);
});

// Get Single Case
app.get('/api/cases/:id', (req, res) => {
  const item = casesStore.find(c => c.caseId === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Case not found" });
  }
  res.json(item);
});

// Create/Save Case
app.post('/api/cases', (req, res) => {
  const newCase = {
    caseId: `CASE-BV-${Math.floor(1000 + Math.random() * 9000)}`,
    farmerId: req.body.farmerId || "BV-2847",
    crop: req.body.crop || "Chilli",
    symptoms: req.body.symptoms || "Crop issue reported",
    aiAnalysis: req.body.aiAnalysis || {},
    weatherContext: req.body.weatherContext || "",
    status: req.body.status || "Monitoring",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  casesStore.unshift(newCase);
  res.status(201).json(newCase);
});

// Case Continuation (Follow-up)
app.post('/api/cases/:id/continue', (req, res) => {
  const { id } = req.params;
  const { progressChoice, additionalVoiceNote, language } = req.body;
  const item = casesStore.find(c => c.caseId === id);

  if (!item) {
    return res.status(404).json({ error: "Case not found" });
  }

  const isTelugu = language === 'te';
  let updatedAdvisory = "";

  if (progressChoice === 'improved') {
    item.status = "Improving";
    updatedAdvisory = isTelugu 
      ? "పంట కోలుకుంటున్నట్లు కనిపిస్తోంది. ప్రస్తుత పరిశీలనను కొనసాగించండి." 
      : "Crop condition appears to be improving. Continue current field regimen.";
  } else if (progressChoice === 'worse') {
    item.status = "Escalated";
    updatedAdvisory = isTelugu 
      ? "సమస్య పెరిగినందున తక్షణమే స్థానిక వ్యవసాయ విస్తరణాధికారిని (AEO) నేరుగా సంప్రదించండి." 
      : "Condition has exacerbated. Directly consult your local Agricultural Extension Officer.";
  } else {
    item.status = "Monitoring";
    updatedAdvisory = isTelugu 
      ? "పరిస్థితిలో మార్పు లేదు. తదుపరి 24 గంటలపాటు తడి మరియు తెగులు వ్యాప్తిని గమనించండి." 
      : "Condition unchanged. Maintain canopy monitoring for next 24 hours.";
  }

  item.updatedAt = new Date().toISOString();
  item.lastProgressNote = progressChoice;
  item.updatedAdvisory = updatedAdvisory;

  res.json({
    success: true,
    updatedCase: item,
    message: updatedAdvisory
  });
});

// Farmer Profile
app.get('/api/farmer/:id', (req, res) => {
  res.json(farmerProfile);
});

app.listen(PORT, () => {
  console.log(`🌾 BhūmiVāṇī Backend API running on http://localhost:${PORT}`);
});
