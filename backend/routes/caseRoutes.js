const express = require("express");
const bcrypt = require("bcryptjs");
const Farmer = require("../models/Farmer");
const Case = require("../models/Case");
const { analyzeCropProblem, processFarmerQuery } = require("../services/aiService");
const router = express.Router();

// Helper to clean/normalize mobile number (keep last 10 digits)
function normalizeMobile(mobile) {
  if (mobile === undefined || mobile === null) return "";
  const value = String(mobile).replace(/\D/g, "");
  return value.slice(-10);
}

// Generate Farmer ID safely (BVM-F-001, BVM-F-002, ...)
async function generateFarmerId() {
  try {
    const lastFarmer = await Farmer.findOne({
      farmerId: { $regex: /^(BVM-F|BV-F)-\d+$/i }
    }).sort({ createdAt: -1 });

    let nextNum = 1;
    if (lastFarmer && lastFarmer.farmerId) {
      const match = lastFarmer.farmerId.match(/(?:BVM-F|BV-F)-(\d+)/i);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    return `BVM-F-${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error("Error generating Farmer ID:", err);
    return `BVM-F-${Date.now().toString().slice(-3)}`;
  }
}

// Generate Case ID safely (BVM-C-001, BVM-C-002, ...)
async function generateCaseId() {
  try {
    const lastCase = await Case.findOne({
      caseId: { $regex: /^(BVM-C|BV-C|BV-D|BV-Q)-\d+$/i }
    }).sort({ createdAt: -1 });

    let nextNum = 1;
    if (lastCase && lastCase.caseId) {
      const match = lastCase.caseId.match(/(?:BVM-C|BV-C|BV-D|BV-Q)-(\d+)/i);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    return `BVM-C-${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error("Error generating Case ID:", err);
    return `BVM-C-${Date.now().toString().slice(-3)}`;
  }
}

// Resolve or create farmer by Phone number or Farmer ID
async function resolveFarmer(mobileInput, farmerIdInput) {
  const normalizedMobile = normalizeMobile(mobileInput);

  // 1. If mobile provided and valid, look up existing farmer by phone
  if (normalizedMobile && normalizedMobile.length === 10) {
    const existingByMobile = await Farmer.findOne({ mobile: normalizedMobile });
    if (existingByMobile) return existingByMobile;
  }

  // 2. If farmerId provided, look up by Farmer ID
  if (farmerIdInput && farmerIdInput.trim()) {
    const existingById = await Farmer.findOne({
      farmerId: new RegExp(`^${farmerIdInput.trim()}$`, 'i')
    });
    if (existingById) return existingById;
  }

  // 3. Otherwise create new Farmer with next BVM-F-XXX
  const farmerId = farmerIdInput && farmerIdInput.trim() ? farmerIdInput.trim().toUpperCase() : await generateFarmerId();
  const hashedPassword = await bcrypt.hash("1234", 10);

  const newFarmer = await Farmer.create({
    farmerId,
    name: "Farmer",
    mobile: normalizedMobile || `98${Date.now().toString().slice(-8)}`,
    password: hashedPassword,
    preferredLanguage: "te",
    crops: []
  });

  return newFarmer;
}

/* =====================================================
   PHONE NUMBER LOOKUP (Returning vs New detection)
   ===================================================== */
router.get('/lookup-phone/:mobile', async (req, res) => {
  try {
    const normalizedMobile = normalizeMobile(req.params.mobile);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required.' });
    }

    const farmer = await Farmer.findOne({ mobile: normalizedMobile });
    if (farmer) {
      const latestCase = await Case.findOne({ farmerId: farmer.farmerId }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        isExisting: true,
        farmerId: farmer.farmerId,
        latestCaseId: latestCase ? latestCase.caseId : null,
        farmer
      });
    }

    return res.json({
      success: true,
      isExisting: false,
      farmerId: null
    });
  } catch (error) {
    console.error('Lookup Phone Error:', error);
    res.status(500).json({ success: false, message: 'Error checking phone number.' });
  }
});

/* =====================================================
   CASE RETRIEVAL & VALIDATION (Farmer ID + Case ID)
   ===================================================== */

// GET single case by farmerId and caseId
router.get('/:farmerId/:caseId', async (req, res) => {
  try {
    const { farmerId, caseId } = req.params;
    if (!farmerId || !caseId) {
      return res.status(400).json({ success: false, message: 'Farmer ID and Case ID are required.' });
    }

    const caseItem = await Case.findOne({
      farmerId: new RegExp(`^${farmerId.trim()}$`, 'i'),
      caseId: new RegExp(`^${caseId.trim()}$`, 'i')
    });

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: "I could not find that case. Please check your Farmer ID and Case ID."
      });
    }

    res.json({
      success: true,
      case: caseItem,
      farmerId: caseItem.farmerId,
      caseId: caseItem.caseId
    });
  } catch (error) {
    console.error('Case Validation Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch case.' });
  }
});

// GET all cases (optionally filtered by farmerId)
router.get('/', async (req, res) => {
  try {
    const { farmerId } = req.query;
    const query = farmerId ? { farmerId: new RegExp(`^${farmerId.trim()}$`, 'i') } : {};
    const cases = await Case.find(query).sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    console.error('Fetch Cases Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch cases.' });
  }
});

// GET single case by caseId
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const caseItem = await Case.findOne({ caseId: new RegExp(`^${id.trim()}$`, 'i') });
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }
    res.json(caseItem);
  } catch (error) {
    console.error('Fetch Case Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch case.' });
  }
});

/* =====================================================
   AUTOMATIC CASE REGISTRATION (POST /api/cases)
   ===================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      mobile,
      farmerId: inputFarmerId,
      crop,
      problem,
      query,
      symptoms,
      description,
      diagnosis,
      advisoryText,
      aiAnalysis,
      weatherContext,
      language = "te",
      status = "open"
    } = req.body;

    // Resolve farmer by mobile number or existing farmerId
    const farmer = await resolveFarmer(mobile, inputFarmerId);
    const caseId = await generateCaseId();

    const resolvedProblem = problem || symptoms || description || query || "Agricultural problem reported";
    const resolvedCrop = crop || "Chilli";

    const newCase = new Case({
      caseId,
      farmer: farmer._id,
      farmerId: farmer.farmerId,
      mobile: farmer.mobile || "",
      caseType: "diagnosis",
      crop: resolvedCrop,
      problem: resolvedProblem,
      description: description || resolvedProblem,
      symptoms: symptoms || resolvedProblem,
      query: query || null,
      diagnosis: diagnosis || advisoryText || (aiAnalysis?.possibleIssue || ""),
      advisoryText: advisoryText || (aiAnalysis?.possibleIssue || ""),
      confidence: aiAnalysis?.confidence || "Moderate",
      observations: Array.isArray(aiAnalysis?.observations) ? aiAnalysis.observations : [],
      recommendedActions: Array.isArray(aiAnalysis?.recommendedActions) ? aiAnalysis.recommendedActions : [],
      aiAnalysis: aiAnalysis || {},
      weatherContext: weatherContext || "",
      language,
      status
    });

    await newCase.save();

    // Update farmer's crops list if new crop reported
    if (resolvedCrop && Array.isArray(farmer.crops) && !farmer.crops.includes(resolvedCrop)) {
      farmer.crops.push(resolvedCrop);
      await farmer.save();
    }

    res.status(201).json({
      success: true,
      registered: true,
      message: language === "te"
        ? `మీ కేసు నమోదు అయింది. మీ Farmer ID ${farmer.farmerId}. మీ Case ID ${newCase.caseId}.`
        : `Your case is registered. Your Farmer ID is ${farmer.farmerId}. Your Case ID is ${newCase.caseId}.`,
      farmerId: farmer.farmerId,
      caseId: newCase.caseId,
      case: newCase
    });
  } catch (error) {
    console.error('Save Case Error:', error);
    res.status(500).json({ success: false, message: 'Unable to register case.' });
  }
});

/* =====================================================
   FOLLOW-UP FOR EXISTING CASE (POST /:id/continue)
   ===================================================== */

router.post('/:id/continue', async (req, res) => {
  try {
    const { id } = req.params;
    const { progressChoice, farmerVoiceAnswer, language = "te", weather = {} } = req.body;

    const caseItem = await Case.findOne({ caseId: new RegExp(`^${id.trim()}$`, 'i') });
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const isTelugu = language === 'te';
    let updatedAdvisory = "";

    if (farmerVoiceAnswer && farmerVoiceAnswer.trim()) {
      // Generate updated advisory using AI with farmer's new answer + weather
      try {
        const aiFollowUp = await processFarmerQuery({
          query: farmerVoiceAnswer,
          farmerContext: {
            farmerId: caseItem.farmerId,
            crop: caseItem.crop,
            previousCase: `${caseItem.problem || caseItem.symptoms} - ${caseItem.diagnosis || caseItem.advisoryText}`
          },
          weather,
          language
        });
        updatedAdvisory = aiFollowUp.advisoryText;
      } catch (err) {
        console.error("AI Follow-up error:", err.message);
      }
    }

    if (!updatedAdvisory) {
      if (progressChoice === 'improved') {
        caseItem.status = "resolved";
        updatedAdvisory = isTelugu
          ? "మీ పంట పరిస్థితి మెరుగుపడిందని తెలుసుకోవడం ఆనందంగా ఉంది. ప్రస్తుతం సూచించిన చర్యలను కొనసాగించండి."
          : "Crop condition appears to be improving. Continue the recommended regimen and monitor regularly.";
      } else if (progressChoice === 'worse') {
        caseItem.status = "followup";
        updatedAdvisory = isTelugu
          ? "పంట పరిస్థితి మరింత దిగజారింది. అధిక తేమ వల్ల తెగులు వ్యాప్తి చెందే అవకాశం ఉంది. వర్షం ముందు మందులు పిచికారీ చేయవద్దు మరియు స్థానిక వ్యవసాయ విస్తరణాధికారిని సంప్రదించండి."
          : "The damage has increased. High humidity may increase fungal spread. Avoid spraying before rain and consult your local Agricultural Extension Officer.";
      } else {
        caseItem.status = "followup";
        updatedAdvisory = isTelugu
          ? "పంట పరిస్థితిలో మార్పు లేదు. వాతావరణ పరిస్థితులను గమనిస్తూ సూచించిన చర్యలను కొనసాగించండి."
          : "Condition unchanged. Continue monitoring the field and spray only in favorable weather.";
      }
    }

    caseItem.followUpHistory.push({
      note: farmerVoiceAnswer || progressChoice || "",
      choice: progressChoice || "note",
      advisory: updatedAdvisory,
      timestamp: new Date()
    });

    await caseItem.save();

    res.json({
      success: true,
      updatedCase: caseItem,
      message: updatedAdvisory
    });
  } catch (error) {
    console.error('Continue Case Error:', error);
    res.status(500).json({ success: false, message: 'Unable to continue case.' });
  }
});

/* =====================================================
   BASIC PHONE ALIAS ENDPOINTS
   ===================================================== */

router.post('/basic-phone/new', async (req, res) => {
  try {
    const { mobile, crop = "Chilli", description = "", language = "te", weather = {} } = req.body || {};
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Agriculture problem description is required." });
    }

    const farmer = await resolveFarmer(mobile);
    const caseId = await generateCaseId();

    const analysis = await analyzeCropProblem({ crop, description, language, weather });

    const newCase = await Case.create({
      caseId,
      farmer: farmer._id,
      farmerId: farmer.farmerId,
      mobile: farmer.mobile || "",
      caseType: "diagnosis",
      crop,
      problem: description,
      description,
      symptoms: description,
      diagnosis: analysis.possibleIssue || "",
      advisoryText: analysis.shortAdvisory || analysis.advisoryText || "",
      confidence: analysis.confidence || "Moderate",
      observations: Array.isArray(analysis.observations) ? analysis.observations : [],
      recommendedActions: Array.isArray(analysis.recommendedActions) ? analysis.recommendedActions : [],
      aiAnalysis: analysis,
      weather: {
        temperature: weather.temperature || "",
        humidity: weather.humidity || "",
        rainProbability: weather.rainProbability || "",
        windSpeed: weather.windSpeed || "",
        spraySuitability: weather.spraySuitability || ""
      },
      status: "open"
    });

    return res.status(201).json({
      success: true,
      registered: true,
      message: language === "te"
        ? `మీ కేసు నమోదు అయింది. మీ Farmer ID ${farmer.farmerId}. మీ Case ID ${newCase.caseId}.`
        : `Your case is registered. Your Farmer ID is ${farmer.farmerId}. Your Case ID is ${newCase.caseId}.`,
      farmerId: farmer.farmerId,
      caseId: newCase.caseId,
      analysis,
      case: newCase
    });
  } catch (error) {
    console.error("Basic phone new case error:", error);
    res.status(500).json({ success: false, message: "Unable to register case." });
  }
});

router.post('/basic-phone/restore', async (req, res) => {
  try {
    const { farmerId, caseId } = req.body || {};
    if (!farmerId || !caseId) {
      return res.status(400).json({ success: false, message: "Farmer ID and Case ID are required." });
    }

    const caseItem = await Case.findOne({
      farmerId: new RegExp(`^${farmerId.trim()}$`, 'i'),
      caseId: new RegExp(`^${caseId.trim()}$`, 'i')
    });

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: "I could not find that case. Please check your Farmer ID and Case ID."
      });
    }

    return res.json({
      success: true,
      restored: true,
      farmerId: caseItem.farmerId,
      caseId: caseItem.caseId,
      case: caseItem
    });
  } catch (error) {
    console.error("Restore case error:", error);
    res.status(500).json({ success: false, message: "Unable to restore case." });
  }
});

module.exports = router;