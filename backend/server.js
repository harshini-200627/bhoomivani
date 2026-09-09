const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { getAgriculturalWeather } = require("./services/weatherService");
const { analyzeCropProblem, processFarmerQuery } = require("./services/aiService");
const Farmer = require("./models/Farmer");

dotenv.config({ path: path.join(__dirname, ".env") });

// Automatically sync BHŪMIVĀṆĪ official logo image as website favicon
const fs = require("fs");
try {
  const logoSource = "C:/Users/LENOVO/.gemini/antigravity/brain/c0105642-1eb2-407c-8017-519cda6bc765/.user_uploaded/media_1788922242240.jpg";
  const targets = [
    path.join(__dirname, "../frontend/public"),
    path.join(__dirname, "../../scratch/bhoomivani/frontend/public")
  ];
  if (fs.existsSync(logoSource)) {
    targets.forEach(targetDir => {
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(logoSource, path.join(targetDir, "favicon.jpg"));
      fs.copyFileSync(logoSource, path.join(targetDir, "logo.jpg"));
    });
  }
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Helper to determine if query requires real-time weather
function queryNeedsWeather(queryText) {
  if (!queryText) return false;
  const q = queryText.toLowerCase();
  const weatherTerms = [
    "rain", "weather", "temperature", "humidity", "wind", "forecast", "climate", "hot", "cold",
    "spray", "spraying", "irrigate", "irrigation", "water", "wet", "dry",
    "వర్షం", "వాతావరణ", "ఉష్ణోగ్రత", "తేమ", "గాలి", "పిచికారీ", "నీరు", "తడి"
  ];
  return weatherTerms.some((term) => q.includes(term));
}

// Root welcome endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BhūmiVāṇī Backend API is running successfully 🌾",
    status: "online"
  });
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "BhūmiVāṇī Backend API",
    timestamp: new Date().toISOString()
  });
});

// Register Routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cases", require("./routes/caseRoutes"));

// Weather endpoint
app.get("/api/weather", async (req, res) => {
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

// AI Crop Analysis (Always includes agricultural weather)
app.post("/api/analyze", async (req, res) => {
  try {
    const { crop, description, image, language, lat, lon } = req.body;
    const weather = await getAgriculturalWeather(lat, lon);
    const analysis = await analyzeCropProblem({
      crop,
      description,
      image,
      language: language || "te",
      weather
    });

    res.json({
      success: analysis.success !== false,
      crop,
      weather,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      success: false,
      message: "We couldn't analyze this right now. Please try again."
    });
  }
});

// AI Farmer General Query (Selective weather optimization)
app.post("/api/farmer-query", async (req, res) => {
  try {
    const { query, conversationHistory, farmerContext, language, lat, lon } = req.body;
    
    // Optimize: only fetch weather if query is relevant to weather / spraying / irrigation
    let weather = {};
    if (queryNeedsWeather(query)) {
      try {
        weather = await getAgriculturalWeather(lat, lon);
      } catch (wErr) {
        console.warn("Weather fetch skipped or failed for query:", wErr.message);
      }
    }

    const result = await processFarmerQuery({
      query,
      conversationHistory: conversationHistory || [],
      farmerContext: farmerContext || {},
      weather,
      language: language || "te"
    });

    res.json(result);
  } catch (error) {
    console.error("Farmer Query Error:", error);
    res.status(500).json({
      success: false,
      error: "Could not process your query.",
      advisoryText: language === "te"
        ? "మీ పంటను నిశితంగా గమనించండి. సమస్య తీవ్రంగా ఉంటే స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి."
        : "Continue monitoring your crop. Consult an agricultural extension officer if the issue persists."
    });
  }
});

// High-Quality Native TTS Audio Streaming (Telugu & English)
app.get("/api/tts", async (req, res) => {
  const { text, lang = "te" } = req.query;
  if (!text || !text.trim()) {
    return res.status(400).send("No text provided");
  }

  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text.trim())}`;
    const response = await axios.get(googleTtsUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (err) {
    console.error("TTS Stream Error:", err.message);
    res.status(500).send("TTS audio error");
  }
});

// Farmer Profile
app.get("/api/farmer/:id", async (req, res) => {
  try {
    const farmerId = req.params.id.trim().toUpperCase();
    const farmer = await Farmer.findOne({ farmerId });
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
  } catch (error) {
    console.error("Fetch Farmer Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching farmer profile" });
  }
});

// Get all farmers
app.get("/api/farmers", async (req, res) => {
  try {
    const farmers = await Farmer.find().select("-password");
    res.json({
      success: true,
      farmers
    });
  } catch (error) {
    console.error("Get Farmers Error:", error);
    res.status(500).json({ success: false, message: "Unable to get farmers list." });
  }
});

app.listen(PORT, () => {
  console.log(`🌾 BhūmiVāṇī Backend API running on port ${PORT}`);
});