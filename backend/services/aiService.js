/**
 * BhūmiVāṇī AI Service
 * AI analysis + farmer advisory
 */

const axios = require("axios");

const GEMINI_MODEL = "gemini-3.6-flash";
const API_TIMEOUT_MS = 8000; // 8 seconds timeout for rapid voice feedback

/* =====================================================
   LIGHTWEIGHT INTENT DETECTION
===================================================== */
function detectQueryIntent(queryText) {
  if (!queryText) return "GENERAL_AGRICULTURE";
  const q = String(queryText).toLowerCase();

  if (
    q.includes("rain") ||
    q.includes("weather") ||
    q.includes("temperature") ||
    q.includes("humidity") ||
    q.includes("wind") ||
    q.includes("forecast") ||
    q.includes("climate") ||
    q.includes("వర్షం") ||
    q.includes("వాతావరణ") ||
    q.includes("ఉష్ణోగ్రత") ||
    q.includes("తేమ")
  ) {
    return "WEATHER";
  }

  if (
    q.includes("spray") ||
    q.includes("spraying") ||
    q.includes("pesticide") ||
    q.includes("fungicide") ||
    q.includes("insecticide") ||
    q.includes("పిచికారీ") ||
    q.includes("మందులు")
  ) {
    return "SPRAYING";
  }

  if (
    q.includes("irrigate") ||
    q.includes("irrigation") ||
    q.includes("water") ||
    q.includes("watering") ||
    q.includes("నీరు") ||
    q.includes("నీళ్లు") ||
    q.includes("తడి")
  ) {
    return "IRRIGATION";
  }

  if (
    q.includes("yellow") ||
    q.includes("spot") ||
    q.includes("spots") ||
    q.includes("wilt") ||
    q.includes("wilting") ||
    q.includes("dry") ||
    q.includes("drying") ||
    q.includes("pest") ||
    q.includes("pests") ||
    q.includes("insect") ||
    q.includes("fungus") ||
    q.includes("leaf") ||
    q.includes("leaves") ||
    q.includes("పసుపు") ||
    q.includes("మచ్చ") ||
    q.includes("ఆకు") ||
    q.includes("పురుగు")
  ) {
    return "CROP_PROBLEM";
  }

  return "GENERAL_AGRICULTURE";
}

/* =====================================================
   RULE-BASED FALLBACK FOR CROP ANALYSIS
===================================================== */
function getRuleBasedAnalysis(payload) {
  const {
    crop = "Chilli",
    description = "",
    language = "te",
    weather = {},
  } = payload;

  const isTelugu = language === "te";

  let issueTe = "ఆకుమచ్చల తెగులు";
  let issueEn = "Leaf Spot Disease";

  const cropLower = String(crop || "").toLowerCase() + " " + String(description || "").toLowerCase();

  if (cropLower.includes("rice") || cropLower.includes("వరి") || cropLower.includes("paddy")) {
    issueTe = "వరి అగ్గి తెగులు";
    issueEn = "Rice Blast Disease";
  } else if (cropLower.includes("cotton") || cropLower.includes("ప్రత్తి") || cropLower.includes("పత్తి")) {
    issueTe = "రసం పీల్చే పురుగుల సమస్య";
    issueEn = "Sucking Pest Infestation";
  }

  const rainProb = parseInt(
    String(weather.rainProbability || "30").replace("%", ""),
    10
  );

  let weatherConditionTe = `ప్రస్తుతం వర్ష సూచన ${rainProb} శాతం ఉంది.`;
  let weatherConditionEn = `Current rain probability is ${rainProb}%.`;

  let actionTe = "పంటను నిశితంగా పరిశీలించండి. వర్షం తగ్గిన తర్వాత మాత్రమే తగిన మందులు పిచికారీ చేయండి.";
  let actionEn = "Avoid spraying before rainfall. Inspect the field and spray recommended treatments only after rain subsides.";

  if (rainProb > 50 || weather.spraySuitability === "Unfavorable") {
    weatherConditionTe = "వర్ష సూచన ఎక్కువగా ఉంది మరియు తేమ అధికంగా ఉంది.";
    weatherConditionEn = "Rain probability is high and humidity is elevated.";
    actionTe = "ప్రస్తుతం ఎలాంటి మందులు పిచికారీ చేయవద్దు. వర్షం తగ్గిన తర్వాత పొలంలో నీటి నిల్వ లేకుండా చూడండి.";
    actionEn = "Avoid spraying now. Wait until rainfall reduces and ensure proper field drainage.";
  }

  const shortAdvisory = isTelugu
    ? `సాధ్యమైన సమస్య: ${issueTe}. ${weatherConditionTe} ${actionTe}`
    : `Possible problem: ${issueEn}. ${weatherConditionEn} ${actionEn}`;

  return {
    possibleIssue: isTelugu ? issueTe : issueEn,
    confidence: "Moderate",
    shortAdvisory,
    advisoryText: shortAdvisory,
    observations: isTelugu
      ? ["ఆకులపై మచ్చలు లేదా రంగు మార్పులు కనిపించవచ్చు.", "తేమ వల్ల సిలీంధ్ర వ్యాప్తి పెరగవచ్చు."]
      : ["Small lesions or discoloration on leaves.", "High moisture can increase disease risk."],
    followUpQuestion: isTelugu
      ? "గత నివేదిక నుండి ఆకుల నష్టం పెరిగిందా?"
      : "Has the leaf damage increased since your last report?",
    weatherConsideration: isTelugu ? weatherConditionTe : weatherConditionEn,
    actionTimingStatus: rainProb > 50 ? "wait" : "caution",
    actionTiming: isTelugu ? actionTe : actionEn,
    recommendedActions: isTelugu
      ? [
          "పొలంలో సరైన నీటి పారుదల ఉండేలా చూడండి.",
          "వర్షం తగ్గిన తర్వాత మాత్రమే మందులు వాడండి.",
          "తీవ్రమైన సమస్య ఉంటే వ్యవసాయ అధికారిని సంప్రదించండి.",
        ]
      : [
          "Ensure proper field drainage.",
          "Apply treatments only in dry conditions.",
          "Consult local Agricultural Extension Officer if severe.",
        ],
  };
}

/* =====================================================
   RULE-BASED FALLBACK FOR ASK ADVISORY QUERIES
===================================================== */
function getRuleBasedQueryAnswer(query, language, weather = {}, farmerContext = {}) {
  const isTe = language === "te";
  const intent = detectQueryIntent(query);
  const rainProb = parseInt(String(weather.rainProbability || "30").replace("%", ""), 10);

  if (intent === "WEATHER") {
    return isTe
      ? `ప్రస్తుత ఉష్ణోగ్రత ${weather.temperature || "30°C"}, వర్ష సూచన ${weather.rainProbability || "30 శాతం"}. వాతావరణాన్ని బట్టి వ్యవసాయ పనులు చేపట్టండి.`
      : `Current temperature is ${weather.temperature || "30°C"} with a ${weather.rainProbability || "30%"} rain probability. Plan your operations accordingly.`;
  }

  if (intent === "SPRAYING") {
    if (rainProb > 40) {
      return isTe
        ? "వర్ష సూచన ఉన్నందున ప్రస్తుతం పిచికారీ చేయడం మంచిది కాదు. వర్షం తగ్గిన తర్వాత పొడి వాతావరణంలో పిచికారీ చేయండి."
        : "Today's conditions are not ideal for spraying because rain is possible. It is better to wait for a suitable dry period.";
    }
    return isTe
      ? "వాతావరణం అనుకూలంగా ఉంది. ఉదయం లేదా సాయంత్రం వేళల్లో సిఫార్సు చేసిన మోతాదులో మాత్రమే పిచికారీ చేయండి."
      : "Weather conditions are favorable. Apply recommended treatments during morning or late afternoon hours.";
  }

  if (intent === "IRRIGATION") {
    if (rainProb > 45) {
      return isTe
        ? "వర్ష సూచన ఉన్నందున ప్రస్తుతం నీరు పెట్టవద్దు. పొలంలో నీరు నిల్వ ఉండకుండా చూడండి."
        : "Because rain is expected, avoid irrigation right now. Ensure proper field drainage.";
    }
    return isTe
      ? "నేల పైపొర ఆరినప్పుడు మాత్రమే నీరు పెట్టండి. పంట మొదళ్లలో నీరు నిల్వ ఉండకుండా చూసుకోండి."
      : "For chilli, irrigate when the soil starts becoming dry. Avoid irrigation if heavy rain is expected.";
  }

  if (intent === "CROP_PROBLEM") {
    return isTe
      ? "ఆకులు పసుపు మారడానికి పోషకాల లోపం లేదా వేరు ఒత్తిడి కారణం కావచ్చు. నేల తేమను పరిశీలించి అధిక నీటిని నివారించండి."
      : "Yellow leaves can have several causes such as nutrient deficiency or root stress. Check soil moisture and avoid overwatering.";
  }

  return isTe
    ? "మీ పంటను క్రమం తప్పకుండా గమనించండి. సరైన నీటి పారుదల మరియు సేంద్రీయ పోషకాలు అందించడం ద్వారా పంట ఎదుగుదల బాగుంటుంది."
    : "Monitor your crop regularly. Maintain balanced irrigation and ensure proper field drainage for healthy plant growth.";
}

/* =====================================================
   CROP ANALYSIS (Basic Phone & Crop Diagnosis)
===================================================== */
async function analyzeCropProblem(payload) {
  const {
    crop = "Chilli",
    description = "",
    image = null,
    language = "te",
    weather = {},
  } = payload;

  const apiKey = process.env.GEMINI_API_KEY;
  const isTelugu = language === "te";

  if (!apiKey) {
    return {
      ...getRuleBasedAnalysis(payload),
      generationMode: "rule_based",
      modelUsed: "none",
    };
  }

  try {
    let inlineData = null;
    if (image) {
      const match = image.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (match) {
        inlineData = {
          mimeType: match[1],
          data: match[2],
        };
      }
    }

    const prompt = `
You are BhūmiVāṇī, an agricultural voice AI assistant.

Analyze Crop: ${crop}
Description: ${description}
Weather: Temp ${weather.temperature || "30°C"}, Humidity ${weather.humidity || "75%"}, Rain ${weather.rainProbability || "40%"}

Provide a SHORT, CONCISE, 3-PART agricultural advisory suitable for voice playback (1 to 3 sentences maximum):
1. Possible disease/problem
2. Relevant weather consideration
3. Recommended immediate action

Language: ${isTelugu ? "Telugu" : "English"}

Respond ONLY with valid JSON:
{
  "possibleIssue": "Disease/Pest name",
  "shortAdvisory": "1-3 sentences combining: Possible problem + Weather consideration + Recommended action",
  "confidence": "High | Moderate | Low",
  "recommendedActions": ["action 1", "action 2"]
}
`;

    const parts = [{ text: prompt }];
    if (inlineData) parts.push({ inlineData });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      geminiUrl,
      {
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json" },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: API_TIMEOUT_MS,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) throw new Error("Empty Gemini response");

    const parsed = JSON.parse(text);
    return {
      ...parsed,
      advisoryText: parsed.shortAdvisory || parsed.possibleIssue,
      generationMode: "real_gemini",
      modelUsed: GEMINI_MODEL,
    };
  } catch (error) {
    console.warn("Using rule-based crop analysis fallback:", error.message);
    return {
      ...getRuleBasedAnalysis(payload),
      generationMode: "rule_based_fallback",
      modelUsed: GEMINI_MODEL,
    };
  }
}

/* =====================================================
   ASK ADVISORY & GENERAL QUERY (Conversational Multi-turn)
===================================================== */
async function processFarmerQuery(payload) {
  const {
    query = "",
    conversationHistory = [],
    farmerContext = {},
    weather = {},
    language = "te",
  } = payload;

  const isTelugu = language === "te";

  if (!query || !query.trim()) {
    return {
      success: false,
      advisoryText: isTelugu
        ? "దయచేసి మీ వ్యవసాయ ప్రశ్నను చెప్పండి."
        : "Please ask your agricultural question.",
    };
  }

  const detectedIntent = detectQueryIntent(query);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallbackAnswer = getRuleBasedQueryAnswer(query, language, weather, farmerContext);
    return {
      success: true,
      isAiGenerated: false,
      generationMode: "rule_based",
      intent: detectedIntent,
      advisoryText: fallbackAnswer,
      shortAdvisory: fallbackAnswer,
    };
  }

  // Only take the last 2-3 recent turns to keep prompts light and fast
  let historyContext = "";
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    historyContext = conversationHistory
      .slice(-3)
      .map((m) => `${m.sender === "farmer" ? "User" : "BhūmiVāṇī"}: ${m.text}`)
      .join("\n");
  }

  const weatherSnippet = weather.temperature
    ? `Current Weather: Temp ${weather.temperature}, Rain Chance ${weather.rainProbability || "N/A"}.`
    : "";

  const systemInstructions = `
You are BhūmiVāṇī, a helpful agricultural voice AI assistant.
Answer the farmer's question directly, accurately, and practical to their situation.

INTENT: ${detectedIntent}

RULES:
- Answer the specific question directly (do NOT force a template).
- Keep the response SHORT (1 to 3 sentences maximum) for comfortable voice listening.
- If the question is about weather/spraying, reference current weather conditions.
- If follow-up, answer in context of previous dialogue.
- Respond entirely in ${isTelugu ? "Telugu (తెలుగు)" : "English"}.
- Do NOT use markdown symbols (*, _, #, bullet points).
- Do NOT mention brands or unsafe dosages.
`;

  const userPrompt = `
${weatherSnippet}
${historyContext ? `Recent Context:\n${historyContext}\n` : ""}
Farmer Question: "${query}"
Answer (1-3 sentences):
`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      geminiUrl,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstructions}\n\n${userPrompt}` }]
          }
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: API_TIMEOUT_MS,
      }
    );

    let advisoryText = response.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!advisoryText) throw new Error("Empty Gemini response");

    // Clean any markdown markers
    advisoryText = advisoryText.replace(/[*_`#]/g, "").replace(/\n+/g, " ").trim();

    return {
      success: true,
      isAiGenerated: true,
      intent: detectedIntent,
      generationMode: "real_gemini",
      modelUsed: GEMINI_MODEL,
      advisoryText,
      shortAdvisory: advisoryText,
      language,
    };
  } catch (error) {
    console.warn("Using rule-based query fallback:", error.message);
    const fallbackAnswer = getRuleBasedQueryAnswer(query, language, weather, farmerContext);
    return {
      success: true,
      isAiGenerated: false,
      intent: detectedIntent,
      generationMode: "rule_based_fallback",
      modelUsed: GEMINI_MODEL,
      advisoryText: fallbackAnswer,
      shortAdvisory: fallbackAnswer,
    };
  }
}

module.exports = {
  analyzeCropProblem,
  processFarmerQuery,
  getRuleBasedAnalysis,
  detectQueryIntent,
};