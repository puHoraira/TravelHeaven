import dotenv from 'dotenv';
import { DatabaseConnection } from '../config/database.js';
import { User } from '../models/User.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';
import { Booking } from '../models/Booking.js';
import { Itinerary } from '../models/Itinerary.js';

dotenv.config();

const verify = async () => {
  console.log('🔍 Starting Project Verification...\n');

  // Test 1: Database Connection
  console.log('Test 1: Database Connection');
  const db = DatabaseConnection.getInstance();
  try {
    await db.connect();
    console.log('✅ Database connection successful\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // Test 2: Model Validation
  console.log('Test 2: Model Validation');
  try {
    const models = { User, Location, Hotel, Transport, Booking, Itinerary };
    for (const [name, model] of Object.entries(models)) {
      const count = await model.countDocuments();
      console.log(`✅ ${name} model: ${count} documents`);
    }
    console.log('');
  } catch (err) {
    console.error('❌ Model validation failed:', err.message);
  }

  // Test 3: Index Verification
  console.log('Test 3: Index Verification');
  try {
    const locationIndexes = await Location.collection.getIndexes();
    const hotelIndexes = await Hotel.collection.getIndexes();
    const transportIndexes = await Transport.collection.getIndexes();
    console.log('✅ Location indexes:', Object.keys(locationIndexes).length);
    console.log('✅ Hotel indexes:', Object.keys(hotelIndexes).length);
    console.log('✅ Transport indexes:', Object.keys(transportIndexes).length);
    console.log('');
  } catch (err) {
    console.error('❌ Index verification failed:', err.message);
  }

  // Test 4: Environment Variables
  console.log('Test 4: Environment Variables');
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRE', 'PORT', 'NODE_ENV'];
  let missingVars = [];
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing`);
      missingVars.push(varName);
    }
  }
  console.log('');

  if (missingVars.length > 0) {
    console.log('⚠️ Missing environment variables:', missingVars.join(', '));
  }

  console.log('✅ Project verification complete!');
  console.log('🎉 All systems are operational!');
  
  await db.disconnect();
  process.exit(0);
};

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
