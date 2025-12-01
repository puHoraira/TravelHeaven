/**
 * Remove Test Data for Recommendation Feature
 * Deletes all data tagged with isTestData: true
 * Safe to run - only removes test data, preserves real data
 */

import dotenv from 'dotenv';
import { DatabaseConnection } from '../config/database.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';
import { User } from '../models/User.js';

dotenv.config();

const unseedRecommendationTestData = async () => {
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    console.log('🗑️  Removing recommendation test data...');

    // Delete only test data (where isTestData: true)
    const deletedLocations = await Location.deleteMany({ isTestData: true });
    console.log(`✅ Removed ${deletedLocations.deletedCount} test locations`);

    const deletedHotels = await Hotel.deleteMany({ isTestData: true });
    console.log(`✅ Removed ${deletedHotels.deletedCount} test hotels`);

    const deletedTransport = await Transport.deleteMany({ isTestData: true });
    console.log(`✅ Removed ${deletedTransport.deletedCount} test transport options`);

    const deletedUsers = await User.deleteMany({ isTestData: true });
    console.log(`✅ Removed ${deletedUsers.deletedCount} test users`);

    console.log('\n🎉 Test data cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Locations removed: ${deletedLocations.deletedCount}`);
    console.log(`   - Hotels removed: ${deletedHotels.deletedCount}`);
    console.log(`   - Transport removed: ${deletedTransport.deletedCount}`);
    console.log(`   - Users removed: ${deletedUsers.deletedCount}`);
    console.log(`   - Total removed: ${deletedLocations.deletedCount + deletedHotels.deletedCount + deletedTransport.deletedCount + deletedUsers.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing test data:', error);
    process.exit(1);
  }
};

unseedRecommendationTestData();
