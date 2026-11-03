const Incident = require('../models/Incident');
const { INCIDENT_STATUS, INCIDENT_REPORT_RADIUS_M, INCIDENT_VALIDATION_THRESHOLD } = require('../config/constants');

/**
 * Report Verification Algorithm (panel revision).
 * Rule-based credibility score for a new incident report: starts at 100 and loses points for
 * each sign of a false or misleading report (description that does not match the chosen
 * category, gibberish, very short text, a burst of reports from the same resident). Reports
 * corroborated by other residents nearby gain points. Officials see the score and flags.
 */

const EARTH_RADIUS_M = 6378100;

// English + Filipino words that a genuine description of each category usually contains.
const CATEGORY_KEYWORDS = {
  fire: ['fire', 'smoke', 'burn', 'flame', 'sunog', 'usok', 'apoy', 'nasusunog', 'nasunog'],
  electrical: ['wire', 'electric', 'power', 'post', 'spark', 'transformer', 'kuryente', 'kawad', 'poste', 'brownout', 'outlet', 'meralco', 'linya'],
  road_accident: ['car', 'motor', 'vehicle', 'crash', 'collision', 'hit', 'road', 'tricycle', 'jeep', 'truck', 'banggaan', 'nabangga', 'sasakyan', 'aksidente', 'kalsada', 'bike'],
  rescue: ['trapped', 'stuck', 'help', 'rescue', 'stranded', 'drown', 'missing', 'naipit', 'tulong', 'saklolo', 'nalunod', 'nawawala', 'na-stranded'],
  flood: ['flood', 'water', 'baha', 'tubig', 'binaha', 'knee', 'waist', 'tuhod', 'baywang', 'apaw', 'umaapaw', 'drainage', 'kanal'],
  medical: ['sick', 'injur', 'hurt', 'blood', 'faint', 'unconscious', 'breath', 'pain', 'hospital', 'ambulance', 'sakit', 'nahimatay', 'dugo', 'sugat', 'hinimatay', 'buntis', 'seizure'],
  crime: ['steal', 'stole', 'theft', 'rob', 'snatch', 'drug', 'gun', 'knife', 'stab', 'shoot', 'nakaw', 'magnanakaw', 'holdap', 'droga', 'baril', 'saksak', 'barilan'],
  dispute: ['fight', 'argue', 'quarrel', 'noise', 'neighbor', 'away', 'gulo', 'sigawan', 'kapitbahay', 'ingay', 'suntukan', 'lasing'],
  earthquake: ['earthquake', 'quake', 'shake', 'crack', 'collapse', 'lindol', 'yanig', 'gumuho', 'bitak'],
  typhoon: ['typhoon', 'storm', 'wind', 'tree', 'roof', 'bagyo', 'hangin', 'puno', 'bubong', 'natumba'],
  accident: ['accident', 'fell', 'fall', 'slip', 'injur', 'aksidente', 'nahulog', 'nadulas', 'natumba'],
  infrastructure: ['road', 'bridge', 'pothole', 'drain', 'pipe', 'leak', 'wall', 'sira', 'butas', 'tulay', 'kalsada', 'tubo', 'pader', 'gumuho'],
};

const words = (text) => (text.toLowerCase().match(/[a-zñ'-]+/g) || []).filter(Boolean);

const mentionsCategory = (text, category) => {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords) return true; // "Others" has no fixed vocabulary
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
};

/** Gibberish: mostly non-letters, a long run of one character, or words without vowels. */
const looksLikeGibberish = (text) => {
  const letters = (text.match(/[a-zñ]/gi) || []).length;
  if (letters < text.replace(/\s/g, '').length * 0.6) return true;
  if (/(.)\1{4,}/i.test(text)) return true;
  const list = words(text);
  if (!list.length) return true;
  const noVowel = list.filter((w) => w.length > 3 && !/[aeiou]/.test(w)).length;
  return noVowel / list.length > 0.4;
};

const nearbyFilter = ([lng, lat]) => ({
  location: { $geoWithin: { $centerSphere: [[lng, lat], INCIDENT_REPORT_RADIUS_M / EARTH_RADIUS_M] } },
});

/** The resident's own unresolved report in the same area, if any (one report per person per area). */
const findOwnActiveReportNearby = (userId, coordinates) =>
  Incident.findOne({
    reportedBy: userId,
    isArchived: false,
    status: { $ne: INCIDENT_STATUS.RESOLVED },
    ...nearbyFilter(coordinates),
  }).select('referenceCode');

/** Unresolved reports of the same category nearby from the last 24 hours, by other residents. */
const findCorroboratingReports = (userId, category, coordinates) =>
  Incident.find({
    reportedBy: { $ne: userId },
    category,
    isArchived: false,
    status: { $ne: INCIDENT_STATUS.RESOLVED },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ...nearbyFilter(coordinates),
  }).select('_id reportedBy');

/** Scores a new report. Returns { score, status, flags }. */
const scoreReport = async ({ userId, category, description, corroborations }) => {
  const flags = [];
  let score = 100;
  const text = (description || '').trim();

  if (looksLikeGibberish(text)) {
    score -= 55;
    flags.push('Description looks like random characters');
  } else {
    if (words(text).length < 4) {
      score -= 15;
      flags.push('Description is very short');
    }
    if (!mentionsCategory(text, category)) {
      score -= 25;
      flags.push('Description does not match the selected category');
    }
  }

  if (text.length > 15 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
    score -= 5;
    flags.push('Description written in all caps');
  }

  const recentByUser = await Incident.countDocuments({ reportedBy: userId, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
  if (recentByUser >= 3) {
    score -= 20;
    flags.push(`Resident sent ${recentByUser} other reports in the last hour`);
  }

  score += Math.min(corroborations, INCIDENT_VALIDATION_THRESHOLD) * 10;
  score = Math.max(0, Math.min(100, score));

  const status = score >= 80 ? 'likely_valid' : score >= 50 ? 'needs_review' : 'suspicious';
  return { score, status, flags };
};

module.exports = { findOwnActiveReportNearby, findCorroboratingReports, scoreReport };
