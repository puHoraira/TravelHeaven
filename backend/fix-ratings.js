import mongoose from 'mongoose';
import { Location } from './src/models/Location.js';
import { Review } from './src/models/Review.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelheaven';

async function fixRatings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all locations
    const locations = await Location.find({});
    console.log(`📍 Found ${locations.length} locations`);

    for (const location of locations) {
      // Calculate average rating from reviews
      const result = await Review.aggregate([
        { 
          $match: { 
            reviewType: 'location',
            referenceId: location._id
          } 
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      const rating = result.length > 0 ? result[0] : { average: 0, count: 0 };
      
      // Update location
      location.rating = {
        average: rating.average,
        count: rating.count
      };
      
      await location.save();
      
      console.log(`✅ Updated ${location.name}: ${rating.average.toFixed(2)} (${rating.count} reviews)`);
    }

    console.log('🎉 All ratings updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRatings();
