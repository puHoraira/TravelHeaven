import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DatabaseConnection } from '../config/database.js';
import { Review } from '../models/Review.js';
import { Location } from '../models/Location.js';

dotenv.config();

function looksLikeJsonArray(str) {
  if (typeof str !== 'string') return false;
  const s = str.trim();
  return (s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'));
}

function normalizeArrayField(val) {
  if (!val) return [];
  const parseMaybeJsonArray = (v) => {
    if (typeof v === 'string' && looksLikeJsonArray(v)) {
      try {
        return JSON.parse(v.replace(/^"|"$/g, ''));
      } catch {
        return [v];
      }
    }
    return Array.isArray(v) ? v : [v];
  };

  let arr = Array.isArray(val) ? val : parseMaybeJsonArray(val);
  // Flatten and parse nested JSON-array strings
  arr = arr.flatMap((el) => {
    if (typeof el === 'string' && looksLikeJsonArray(el)) {
      try {
        const parsed = JSON.parse(el.replace(/^"|"$/g, ''));
        return Array.isArray(parsed) ? parsed : [el];
      } catch {
        return [el];
      }
    }
    return Array.isArray(el) ? el : [el];
  });
  return arr.map((x) => (typeof x === 'string' ? x : String(x)));
}

async function recalcLocations() {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  const locations = await Location.find({});
  console.log(`Found ${locations.length} locations. Recalculating ratings...`);

  for (const loc of locations) {
    const agg = await Review.aggregate([
      { $match: { reviewType: 'location', referenceId: loc._id } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const average = agg.length ? agg[0].average : 0;
    const count = agg.length ? agg[0].count : 0;

    // Also normalize attractions/activities if saved as JSON strings
    const attractions = normalizeArrayField(loc.attractions);
    const activities = normalizeArrayField(loc.activities);

    loc.rating = { average, count };
    loc.attractions = attractions;
    loc.activities = activities;
    loc.updatedAt = new Date();
    await loc.save();

    console.log(`✓ ${loc.name}: avg=${average?.toFixed?.(2) ?? average} count=${count}`);
  }

  await db.disconnect();
  await mongoose.disconnect();
  console.log('Done');
}

recalcLocations().catch(async (err) => {
  console.error('Recalc failed:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
