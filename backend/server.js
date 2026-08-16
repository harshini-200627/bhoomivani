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

// ======================================================
// HOME
// ======================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BhūmiVāṇī Backend API is running successfully 🌾',
    status: 'online'
  });
});

// ======================================================
// IN-MEMORY DATA STORE
// ======================================================

let casesStore = [
  {
    caseId: "BVM-C-001",
    farmerId: "BVM-F-001",
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
    caseId: "BVM-C-002",
    farmerId: "BVM-F-001",
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

let farmersStore = [
  {
    farmerId: "BVM-F-001",
    name: "Demo Farmer (రైతు సోదరుడు)",
    preferredLanguage: "te",
    location: "Vijayawada, Andhra Pradesh",
    crops: ["Chilli", "Rice"],
    createdAt: new Date().toISOString()
  }
];

// ======================================================
// COUNTERS
// ======================================================

let farmerCounter = 1;
let caseCounter = 2;

// ======================================================
// ID GENERATORS
// ======================================================

function generateFarmerId() {
  farmerCounter += 1;
  return `BVM-F-${String(farmerCounter).padStart(3, '0')}`;
}

function generateCaseId() {
  caseCounter += 1;
  return `BVM-C-${String(caseCounter).padStart(3, '0')}`;
}

// ======================================================
// HEALTHCHECK
// ======================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BhūmiVāṇī Backend API',
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// WEATHER
// ======================================================

app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const weather = await getAgriculturalWeather(lat, lon);

    res.json(weather);

  } catch (error) {
    console.error("Weather Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch agricultural weather."
    });
  }
});

// ======================================================
// AI CROP ANALYSIS
// ======================================================

app.post('/api/analyze', async (req, res) => {
  try {
    const {
      crop,
      description,
      image,
      language,
      lat,
      lon
    } = req.body;

    const weather = await getAgriculturalWeather(lat, lon);

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
      message:
        "We couldn't analyze this right now. Please try again or describe the problem using voice."
    });
  }
});

// ======================================================
// GET ALL CASES
// ======================================================

app.get('/api/cases', (req, res) => {
  const farmerId = req.query.farmerId;

  const filtered = farmerId
    ? casesStore.filter(
        c =>
          c.farmerId.toUpperCase() ===
          farmerId.trim().toUpperCase()
      )
    : casesStore;

  res.json(filtered);
});

// ======================================================
// GET SINGLE CASE
// ======================================================

app.get('/api/cases/:id', (req, res) => {
  const caseId = req.params.id.trim().toUpperCase();

  const item = casesStore.find(
    c => c.caseId.toUpperCase() === caseId
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      error: "Case not found"
    });
  }

  res.json(item);
});

// ======================================================
// CREATE / SAVE CASE
// ======================================================

app.post('/api/cases', async (req, res) => {
  try {
    const {
      farmerId: providedFarmerId,
      name,
      crop,
      symptoms,
      description,
      language,
      location,
      lat,
      lon,
      image
    } = req.body;

    // ==================================================
    // 1. WEATHER
    // ==================================================

    const weather = await getAgriculturalWeather(lat, lon);

    // ==================================================
    // 2. AI ANALYSIS
    // ==================================================

    const analysis = await analyzeCropProblem({
      crop: crop || 'Unknown',
      description: description || symptoms || '',
      imageProvided: !!image,
      language: language || 'te',
      weather
    });

    // ==================================================
    // 3. FIND OR CREATE FARMER
    // ==================================================

    let farmerId = providedFarmerId
      ? providedFarmerId.trim().toUpperCase()
      : null;

    let farmer = farmerId
      ? farmersStore.find(
          f =>
            f.farmerId.toUpperCase() === farmerId
        )
      : null;

    if (!farmer) {
      farmerId = generateFarmerId();

      farmer = {
        farmerId,
        name: name || "Farmer",
        preferredLanguage: language || "te",
        location: location || "",
        crops: crop ? [crop] : [],
        createdAt: new Date().toISOString()
      };

      farmersStore.push(farmer);
    }

    // ==================================================
    // 4. GENERATE CASE ID
    // ==================================================

    const caseId = generateCaseId();

    // ==================================================
    // 5. CREATE CASE
    // ==================================================

    const newCase = {
      caseId,
      farmerId,

      crop: crop || "Unknown",

      symptoms:
        symptoms ||
        description ||
        "Crop issue reported",

      aiAnalysis: analysis,

      weatherContext: weather,

      status: "Monitoring",

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()
    };

    // ==================================================
    // 6. SAVE CASE
    // ==================================================

    casesStore.unshift(newCase);

    // ==================================================
    // 7. SEND RESPONSE
    // ==================================================

    res.status(201).json({
      success: true,

      message:
        "Problem analyzed and case registered successfully.",

      farmerId,

      caseId,

      analysis,

      weather,

      farmer,

      case: newCase
    });

  } catch (error) {
    console.error("Analyze & Save Case Error:", error);

    res.status(500).json({
      success: false,
      message:
        "Unable to analyze and register the case."
    });
  }
});

// ======================================================
// FIND PREVIOUS CASE
// FARMER ID + CASE ID
// ======================================================

app.get('/api/cases/:farmerId/:caseId', (req, res) => {

  const farmerId =
    req.params.farmerId
      .trim()
      .toUpperCase();

  const caseId =
    req.params.caseId
      .trim()
      .toUpperCase();

  console.log("=================================");
  console.log("FIND PREVIOUS CASE");
  console.log("Farmer ID:", farmerId);
  console.log("Case ID:", caseId);
  console.log("=================================");

  // ==================================================
  // FIND FARMER
  // ==================================================

  const farmer = farmersStore.find(
    f =>
      f.farmerId
        .trim()
        .toUpperCase() === farmerId
  );

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: "Farmer ID not found."
    });
  }

  // ==================================================
  // FIND CASE
  // ==================================================

  const item = casesStore.find(
    c =>
      c.farmerId
        .trim()
        .toUpperCase() === farmerId &&
      c.caseId
        .trim()
        .toUpperCase() === caseId
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message:
        "Case ID not found for this Farmer ID."
    });
  }

  // ==================================================
  // SUCCESS
  // ==================================================

  res.json({
    success: true,
    farmer,
    case: item
  });
});

// ======================================================
// CASE CONTINUATION / FOLLOW-UP
// ======================================================

app.post('/api/cases/:id/continue', (req, res) => {

  const id = req.params.id;

  const {
    progressChoice,
    additionalVoiceNote,
    language
  } = req.body;

  const item = casesStore.find(
    c => c.caseId === id
  );

  if (!item) {
    return res.status(404).json({
      error: "Case not found"
    });
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

  if (additionalVoiceNote) {
    item.additionalVoiceNote =
      additionalVoiceNote;
  }

  res.json({
    success: true,
    updatedCase: item,
    message: updatedAdvisory
  });
});

// ======================================================
// FARMER PROFILE
// ======================================================

app.get('/api/farmer/:id', (req, res) => {

  const farmerId =
    req.params.id
      .trim()
      .toUpperCase();

  const farmer = farmersStore.find(
    f =>
      f.farmerId
        .trim()
        .toUpperCase() === farmerId
  );

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: "Farmer not found."
    });
  }

  res.json({
    success: true,
    farmer
  });
});

// ======================================================
// GET ALL FARMERS
// ======================================================

app.get('/api/farmers', (req, res) => {
  res.json({
    success: true,
    farmers: farmersStore
  });
});

// ======================================================
// SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(
    `🌾 BhūmiVāṇī Backend API running on port ${PORT}`
  );
});