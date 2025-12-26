import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
console.log('Preferred Gemini model:', MODEL_NAME);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Cache the last successful model to skip failed attempts
let cachedWorkingModel = null;

// Direct REST call helper to force v1 endpoint
async function generateViaRest(model, prompt) {
  const key = encodeURIComponent(process.env.GEMINI_API_KEY || '');
  const short = (model || '').replace(/^models\//, '');
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  // Try v1 first
  const v1Url = `https://generativelanguage.googleapis.com/v1/models/${short}:generateContent?key=${key}`;
  try {
    console.log('Calling Gemini REST v1 with model:', short);
    const { data } = await axios.post(v1Url, body, { headers: { 'Content-Type': 'application/json' } });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('Empty response from Gemini REST v1');
    return text.trim();
  } catch (e) {
    const status = e?.response?.status;
    if (status !== 404) throw e; // non-404 -> bubble up
    console.warn('v1 returned 404 for model', short, '— trying v1beta');
  }

  // Fallback to v1beta
  const v1betaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${short}:generateContent?key=${key}`;
  const { data } = await axios.post(v1betaUrl, body, { headers: { 'Content-Type': 'application/json' } });
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini REST v1beta');
  return text.trim();
}

// List models available to this API key and method support
async function listAvailableModels() {
  const key = encodeURIComponent(process.env.GEMINI_API_KEY || '');
  // Try v1 first
  const v1Url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
  try {
    console.log('Listing Gemini models via v1');
    const { data } = await axios.get(v1Url);
    return Array.isArray(data?.models) ? data.models : [];
  } catch (e) {
    const status = e?.response?.status;
    if (status !== 404) {
      console.warn('Model list via v1 failed with status', status, '- trying v1beta');
    } else {
      console.warn('v1 model list returned 404 - trying v1beta');
    }
  }
  // Fallback to v1beta
  const v1bUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const { data } = await axios.get(v1bUrl);
  return Array.isArray(data?.models) ? data.models : [];
}

// Pick the best model that supports generateContent
function pickBestModel(models) {
  if (!Array.isArray(models)) return null;
  const supports = models.filter(m => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
  if (supports.length === 0) return null;
  // Prefer flash-8b latest > flash latest > pro latest > anything latest > non-latest
  const score = (name) => {
    const n = name || '';
    let s = 0;
    if (/latest$/.test(n)) s += 4;
    if (/flash-8b/i.test(n)) s += 8;
    else if (/flash/i.test(n)) s += 6;
    else if (/pro/i.test(n)) s += 5;
    if (/1\.5/i.test(n)) s += 2; // prefer 1.5 family
    if (/2\./.test(n)) s += 3; // prefer 2.x when available
    return s;
  };
  supports.sort((a, b) => score(b.name) - score(a.name));
  return supports[0]?.name || null;
}

export const getRouteAdvice = async (req, res, next) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ message: 'origin and destination are required' });
    }

    const prompt = `You are a concise Bangladeshi travel expert.
User travels from "${origin}" to "${destination}".

Suggest 2-3 realistic travel options (bus, train, flight, launch, CNG, rickshaw).
Be brief and practical.

Return ONLY valid JSON (no markdown, no text):
{
  "summary": "1-2 sentence overview",
  "recommendedTransports": [
    {
      "mode": "bus|train|flight|launch|mixed",
      "estimatedDurationMinutes": number,
      "estimatedDurationText": "e.g. 6-7 hours",
      "estimatedCostRange": "500-800 BDT",
      "numberOfStops": number,
      "mustVisitPlaces": ["Place 1", "Place 2"],
      "steps": [
        {
          "order": 1,
          "instruction": "brief clear step",
          "from": "area",
          "to": "area",
          "transportType": "bus|train|etc"
        }
      ],
      "pros": ["2-4 words each"],
      "cons": ["2-4 words each"]
    }
  ]
}`;

    // Try models in order - prioritize 2.x (currently working) and cached successful model
    const candidateModelsRaw = [
      cachedWorkingModel, // Try last successful model first
      MODEL_NAME,
      // Prioritize 2.x family (working on your key)
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-lite-001',
      // Fallback to 1.x if needed
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro',
    ];
    const seen = new Set();
    const candidateModels = candidateModelsRaw.filter(m => {
      if (!m || seen.has(m)) return false;
      seen.add(m);
      return true;
    });

    let lastErr;
    let text;
    for (const m of candidateModels) {
      try {
        console.log('Trying Gemini model:', m);
        // Prefer direct REST v1 call; if it fails not due to 404, fall back to SDK
        try {
          text = await generateViaRest(m, prompt);
        } catch (restErr) {
          const status = restErr?.response?.status;
          if (status === 404) throw restErr; // trigger outer 404 handling
          // Fallback to SDK for compatibility
          const model = genAI.getGenerativeModel({ model: (m || '').replace(/^models\//, '') });
          const result = await model.generateContent(prompt);
          text = result.response.text().trim();
        }
        console.log('Gemini succeeded with model:', m);
        cachedWorkingModel = m; // Cache for next request
        break; // success
      } catch (err) {
        lastErr = err;
        const status = err?.status || err?.response?.status;
        console.warn('Gemini call failed for model', m, 'status:', status);
        // If 404 Not Found (model unsupported for this API version), try next
        if (status === 404) {
          continue;
        }
        // Other errors - stop and bubble up
        throw err;
      }
    }

    if (!text) {
      console.warn('Known candidates failed. Attempting to list models and auto-select.');
      // Discover models for this key
      const models = await listAvailableModels();
      const names = models.map(m => m.name);
      console.log('Available Gemini models for key:', names);
      const best = pickBestModel(models);
      if (!best) {
        throw lastErr || new Error('No available Gemini models support generateContent for this API key.');
      }
      try {
        const bestShort = (best || '').replace(/^models\//, '');
        console.log('Trying discovered best model:', bestShort);
        text = await generateViaRest(bestShort, prompt);
        console.log('Gemini succeeded with discovered model:', bestShort);
        cachedWorkingModel = bestShort; // Cache discovered model
      } catch (err) {
        console.warn('Discovered model failed via REST, trying SDK as fallback');
        const model = genAI.getGenerativeModel({ model: (best || '').replace(/^models\//, '') });
        const result = await model.generateContent(prompt);
        text = result.response.text().trim();
      }
    }

    // Robust JSON cleanup - strip markdown code fences and extra text
    let cleanText = text.trim();
    // Remove markdown code blocks
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    // If starts with non-JSON, try to extract JSON
    if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanText = jsonMatch[0];
    }

    let json;
    try {
      json = JSON.parse(cleanText);
    } catch (e) {
      console.error('JSON parse failed. Raw text:', text);
      return res.status(500).json({
        message: 'AI response was not valid JSON. Please try again.',
        raw: text.substring(0, 500), // Truncate for user display
      });
    }

    return res.json(json);
  } catch (err) {
    console.error('AI route advisor error:', err?.response?.data || err);
    next(err);
  }
};

const coercePositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
};

const extractJson = (text) => {
  let cleanText = (text || '').trim();
  cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
  }
  return cleanText;
};

const normalizeItineraryPreview = (payload, durationDays) => {
  const obj = payload && typeof payload === 'object' ? payload : {};
  const days = Array.isArray(obj.days) ? obj.days : [];
  const normalizedDays = days.map((d, idx) => {
    const activities = Array.isArray(d.activities) ? d.activities : [];
    const normalizedActivities = activities
      .filter(Boolean)
      .slice(0, 6)
      .map((a) => ({
        time_of_day: (a.time_of_day || '').toString(),
        place_name: (a.place_name || '').toString(),
        description: (a.description || '').toString(),
      }))
      .filter((a) => a.place_name);

    // Ensure 2-4 activities minimum
    while (normalizedActivities.length < 2) {
      normalizedActivities.push({
        time_of_day: normalizedActivities.length === 0 ? 'Morning' : 'Evening',
        place_name: 'Free exploration',
        description: 'Explore nearby spots and local food options.',
      });
    }

    return {
      day_number: Number(d.day_number) || idx + 1,
      title: (d.title || `Day ${idx + 1}`).toString(),
      activities: normalizedActivities.slice(0, 4),
    };
  });

  // If AI returned fewer days, pad up to durationDays
  while (normalizedDays.length < durationDays) {
    const nextDay = normalizedDays.length + 1;
    normalizedDays.push({
      day_number: nextDay,
      title: `Day ${nextDay}`,
      activities: [
        { time_of_day: 'Morning', place_name: 'Sightseeing walk', description: 'Start with a relaxed exploration of a nearby attraction.' },
        { time_of_day: 'Evening', place_name: 'Local dinner', description: 'Try a popular local dish and rest.' },
      ],
    });
  }

  return {
    destination: (obj.destination || '').toString(),
    number_of_days: coercePositiveInt(obj.number_of_days, durationDays),
    notes: (obj.notes || '').toString(),
    days: normalizedDays.slice(0, durationDays),
  };
};

/**
 * POST /api/ai/itinerary/preview
 * Generates a structured day-by-day itinerary plan (JSON) without saving.
 */
export const previewItineraryPlan = async (req, res, next) => {
  try {
    const destination = (req.body.destination || '').toString().trim();
    const durationDays = coercePositiveInt(req.body.durationDays, 3);
    const budgetLevel = (req.body.budgetLevel || '').toString().trim();
    const interests = Array.isArray(req.body.interests) ? req.body.interests : [];
    const travelerType = (req.body.travelerType || '').toString().trim();

    if (!destination) {
      return res.status(400).json({ message: 'destination is required' });
    }

    const prompt = `You are a travel planner.
Create a practical day-by-day itinerary for: ${destination}.

Constraints:
- Number of days: ${durationDays}
- Budget level: ${budgetLevel || 'mid'}
- Interests: ${interests.length ? interests.join(', ') : 'general'}
- Traveler type: ${travelerType || 'traveler'}

Return ONLY valid JSON (no markdown, no extra text) with this exact schema:
{
  "destination": "string",
  "number_of_days": number,
  "notes": "string",
  "days": [
    {
      "day_number": number,
      "title": "string",
      "activities": [
        {
          "time_of_day": "Morning|Afternoon|Evening|Night|HH:MM-HH:MM",
          "place_name": "string",
          "description": "string"
        }
      ]
    }
  ]
}

Rules:
- days.length must equal number_of_days.
- Each day must have 2 to 4 activities.
- Keep place_name real-world and Bangladesh-friendly when relevant.
`;

    // Reuse the same model selection approach as getRouteAdvice
    const candidateModelsRaw = [
      cachedWorkingModel,
      MODEL_NAME,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro',
    ];
    const seen = new Set();
    const candidateModels = candidateModelsRaw.filter(m => {
      if (!m || seen.has(m)) return false;
      seen.add(m);
      return true;
    });

    let lastErr;
    let text;
    for (const m of candidateModels) {
      try {
        try {
          text = await generateViaRest(m, prompt);
        } catch (restErr) {
          const status = restErr?.response?.status;
          if (status === 404) throw restErr;
          const model = genAI.getGenerativeModel({ model: (m || '').replace(/^models\//, '') });
          const result = await model.generateContent(prompt);
          text = result.response.text().trim();
        }
        cachedWorkingModel = m;
        break;
      } catch (err) {
        lastErr = err;
        const status = err?.status || err?.response?.status;
        if (status === 404) continue;
        throw err;
      }
    }

    if (!text) {
      throw lastErr || new Error('Failed to generate itinerary preview');
    }

    const cleanText = extractJson(text);
    let json;
    try {
      json = JSON.parse(cleanText);
    } catch (e) {
      return res.status(500).json({
        message: 'AI response was not valid JSON. Please try again.',
        raw: text.substring(0, 500),
      });
    }

    const normalized = normalizeItineraryPreview(json, durationDays);
    return res.json({ success: true, data: normalized });
  } catch (err) {
    console.error('AI itinerary preview error:', err?.response?.data || err);
    next(err);
  }
};
