/**
 * BhūmiVāṇī AI Engine
 * Provides agricultural diagnostic reasoning, adaptive single-questioning,
 * and weather-aware decision support in Telugu and English.
 */

async function analyzeCropProblem(payload) {
  const {
    crop = 'Chilli',
    description = '',
    imageProvided = false,
    language = 'te',
    weather = {},
    previousAnswer = null
  } = payload;

  const isTelugu = language === 'te';
  const descLower = description.toLowerCase();

  // Fungal spot / leaf curl / pest rules
  let possibleIssueTe = "నల్ల మచ్చల తెగులు (Cercospora Leaf Spot)";
  let possibleIssueEn = "Cercospora Leaf Spot";
  let confidence = "Moderate";
  let observationsTe = [
    "ఆకులపై చిన్న చిన్న గోధుమ రంగు మచ్చలు గమనించబడ్డాయి.",
    "వాతావరణ తేమ శాతం ఎక్కువగా ఉండటం వల్ల సిలీంధ్ర వ్యాప్తికి అవకాశం ఉంది."
  ];
  let observationsEn = [
    "Small dark circular brown spots with faint outer rings noticed on lower leaves.",
    "Elevated ambient humidity increases risk of fungal leaf infection."
  ];

  if (crop.toLowerCase().includes('rice') || crop.includes('వరి')) {
    possibleIssueTe = "వరి అగ్గి తెగులు (Rice Blast / Pyricularia)";
    possibleIssueEn = "Rice Blast / Leaf Spot (Pyricularia oryzae)";
    observationsTe = [
      "వరి ఆకులపై కంటి ఆకారపు మచ్చల లక్షణాలు కనిపించాయి.",
      "పొలంలో నిలిచిన నీరు మరియు తేమ గమనించబడింది."
    ];
    observationsEn = [
      "Spindle-shaped elliptical lesions with gray center on paddy blades.",
      "High canopy moisture content identified."
    ];
  } else if (crop.toLowerCase().includes('cotton') || crop.includes('ప్రత్తి')) {
    possibleIssueTe = "పత్తిలో గులాబీ రంగు పురుగు / రసం పీల్చే పురుగులు";
    possibleIssueEn = "Sucking Pests / Aphid Infestation";
    observationsTe = ["ఆకులు కొద్దిగా ముడుచుకోవడం గమనించబడింది."];
    observationsEn = ["Mild leaf curling and stunting noticed under field canopy."];
  }

  // Weather-aware decision support
  const rainProb = parseInt(weather.rainProbability || '40', 10);
  let actionTimingStatus = "favorable"; // favorable | caution | wait
  let actionTimingTe = "🟢 అనుకూల పరిస్థితులు — ఔషధాల పిచికారీకి తగిన సమయం.";
  let actionTimingEn = "🟢 Favorable conditions — Safe window for treatment application.";
  let weatherConsiderationTe = "ప్రస్తుత ఉష్ణోగ్రత మరియు తేమ శాతాలు పొలానికి అనుకూలంగా ఉన్నాయి.";
  let weatherConsiderationEn = "Current field microclimate temperature and humidity are within stable limits.";

  if (rainProb > 50 || weather.spraySuitability === 'Unfavorable') {
    actionTimingStatus = "wait";
    actionTimingTe = "🔴 వేచి ఉండండి — రాబోయే వర్షాల వల్ల మందుల పిచికారీ ఆగాలి.";
    actionTimingEn = "🔴 Wait / Reassess — Rain predicted. Avoid spraying to prevent wash-off.";
    weatherConsiderationTe = `రాబోయే 24 గంటల్లో వర్షాపాతం సూచన (${weather.rainProbability || '60%'}). పిచికారీ చేయడం వల్ల మందులు కొట్టుకుపోయే ప్రమాదం ఉంది.`;
    weatherConsiderationEn = `Precipitation probability is elevated (${weather.rainProbability || '60%'}). Liquid treatments may wash off.`;
  } else if (rainProb > 30 || weather.spraySuitability === 'Caution') {
    actionTimingStatus = "caution";
    actionTimingTe = "🟡 వాతావరణ హెచ్చరిక — ఈ సాయంత్రం లేదా వాతావరణం చల్లబడిన తర్వాత పరిశీలించండి.";
    actionTimingEn = "🟡 Consider weather conditions — Wind or light showers potential.";
    weatherConsiderationTe = "గాలుల వేగం మరియు తేమ మారవచ్చు. వాతావరణం చల్లబడిన తర్వాత చర్యలు తీసుకోండి.";
    weatherConsiderationEn = "Fluctuating wind speeds detected. Spray during calm early morning or late afternoon hours.";
  }

  // Recommended Actions
  let recommendedActionsTe = [
    "పొలంలో నీటి పారుదల మరియు గాలి వెలుతురు సరిగ్గా ఉండేలా చూడండి.",
    "బాధిత ఆకులను గమనిస్తూ ఉండండి, అవసరమైతే స్థానిక వ్యవసాయ విస్తరణాధికారిని (AEO) సంప్రదించండి.",
    "వర్షం తగ్గిన తర్వాత శాస్త్రీయ సిఫార్సుల మేరకు తగిన నివారణ చర్యలు తీసుకోండి."
  ];

  let recommendedActionsEn = [
    "Ensure adequate plant spacing and proper field drainage to lower canopy humidity.",
    "Monitor progress over the next 48 hours without immediately applying harsh non-verified chemicals.",
    "Consult your local Agricultural Extension Officer (AEO) for precise localized product dosage."
  ];

  // Adaptive follow-up question
  const followUpQuestionTe = "ఈ సమస్యను మీరు ఎంతకాలంగా గమనిస్తున్నారు?";
  const followUpQuestionEn = "How long have you noticed this problem?";
  const answerOptionsTe = [
    "🟢 ఈ రోజే",
    "🟡 2–3 రోజుల నుండి",
    "🟠 సుమారు ఒక వారంగా",
    "🔴 వారం కంటే ఎక్కువ కాలంగా",
    "❓ ఖచ్చితంగా తెలియదు"
  ];
  const answerOptionsEn = [
    "🟢 Today",
    "🟡 2–3 days",
    "🟠 About a week",
    "🔴 More than a week",
    "❓ Not sure"
  ];

  return {
    possibleIssue: isTelugu ? possibleIssueTe : possibleIssueEn,
    confidence: confidence,
    observations: isTelugu ? observationsTe : observationsEn,
    followUpQuestion: isTelugu ? followUpQuestionTe : followUpQuestionEn,
    answerOptions: isTelugu ? answerOptionsTe : answerOptionsEn,
    weatherConsideration: isTelugu ? weatherConsiderationTe : weatherConsiderationEn,
    actionTiming: isTelugu ? actionTimingTe : actionTimingEn,
    actionTimingStatus: actionTimingStatus,
    recommendedActions: isTelugu ? recommendedActionsTe : recommendedActionsEn,
    warning: isTelugu 
      ? "⚠️ గమనిక: ఇది AI ఆధారిత సహాయక వ్యవస్థ మాత్రమే. సందేహాలుంటే వ్యవసాయ అధికారులను సంప్రదించండి."
      : "⚠️ Note: This is AI decision support and should be verified with an agricultural officer when uncertain."
  };
}

module.exports = { analyzeCropProblem };
