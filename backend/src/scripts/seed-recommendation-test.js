/**
 * Seed Test Data for Recommendation Feature
 * Creates minimal test data that can be easily identified and removed
 * All test data is tagged with isTestData: true for easy cleanup
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DatabaseConnection } from '../config/database.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';
import { User } from '../models/User.js';

dotenv.config();

const seedRecommendationTestData = async () => {
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    console.log('🌱 Seeding recommendation test data...');

    // Get or create a test guide user for locations
    let testGuide = await User.findOne({ email: 'testguide@recommendation.test' });
    if (!testGuide) {
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      testGuide = await User.create({
        username: 'testrecommendationguide',
        email: 'testguide@recommendation.test',
        password: hashedPassword,
        role: 'guide',
        isTestData: true,
      });
      console.log('✅ Created test guide user');
    }

    // Test Locations - Tagged with isTestData
    const testLocations = [
      {
        name: 'TEST - Cultural Heritage Museum',
        description: 'Test cultural attraction for recommendation system',
        country: 'Bangladesh',
        city: 'Dhaka',
        category: 'cultural',
        coordinates: { latitude: 23.8103, longitude: 90.4125 },
        rating: { average: 4.5, count: 100 },
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Adventure Park',
        description: 'Test adventure location for recommendation system',
        country: 'Bangladesh',
        city: 'Chittagong',
        category: 'adventure',
        coordinates: { latitude: 22.3569, longitude: 91.7832 },
        rating: { average: 4.7, count: 85 },
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Beach Resort Area',
        description: 'Test beach location for recommendation system',
        country: 'Bangladesh',
        city: "Cox's Bazar",
        category: 'beach',
        coordinates: { latitude: 21.4272, longitude: 92.0058 },
        rating: { average: 4.8, count: 200 },
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Historical Fort',
        description: 'Test historical site for recommendation system',
        country: 'Bangladesh',
        city: 'Dhaka',
        category: 'historical',
        coordinates: { latitude: 23.7104, longitude: 90.4074 },
        rating: { average: 4.3, count: 120 },
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Nature Trail',
        description: 'Test nature location for recommendation system',
        country: 'Bangladesh',
        city: 'Sylhet',
        category: 'natural',
        coordinates: { latitude: 24.8949, longitude: 91.8687 },
        rating: { average: 4.6, count: 95 },
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
    ];

    // Test Hotels - Tagged with isTestData
    const testHotels = [
      {
        name: 'TEST - Budget Inn',
        description: 'Test budget hotel for recommendation system',
        address: {
          street: '123 Test Street',
          city: 'Dhaka',
          country: 'Bangladesh',
        },
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103], // [longitude, latitude]
        },
        priceRange: {
          min: 40,
          max: 60,
          currency: 'USD',
        },
        rating: { average: 3.8, count: 50 },
        amenities: ['wifi', 'breakfast', 'parking'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Luxury Resort',
        description: 'Test luxury hotel for recommendation system',
        address: {
          street: '456 Beach Road',
          city: "Cox's Bazar",
          country: 'Bangladesh',
        },
        location: {
          type: 'Point',
          coordinates: [92.0058, 21.4272],
        },
        priceRange: {
          min: 180,
          max: 250,
          currency: 'USD',
        },
        rating: { average: 4.9, count: 150 },
        amenities: ['wifi', 'pool', 'spa', 'restaurant', 'gym'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Mid-Range Hotel',
        description: 'Test mid-range hotel for recommendation system',
        address: {
          street: '789 City Center',
          city: 'Chittagong',
          country: 'Bangladesh',
        },
        location: {
          type: 'Point',
          coordinates: [91.7832, 22.3569],
        },
        priceRange: {
          min: 80,
          max: 120,
          currency: 'USD',
        },
        rating: { average: 4.2, count: 80 },
        amenities: ['wifi', 'breakfast', 'restaurant'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Comfort Stay',
        description: 'Test comfort hotel for recommendation system',
        address: {
          street: '321 Green Valley',
          city: 'Sylhet',
          country: 'Bangladesh',
        },
        location: {
          type: 'Point',
          coordinates: [91.8687, 24.8949],
        },
        priceRange: {
          min: 70,
          max: 100,
          currency: 'USD',
        },
        rating: { average: 4.0, count: 60 },
        amenities: ['wifi', 'breakfast', 'parking'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        name: 'TEST - Economy Lodge',
        description: 'Test economy hotel for recommendation system',
        address: {
          street: '654 Budget Lane',
          city: 'Dhaka',
          country: 'Bangladesh',
        },
        location: {
          type: 'Point',
          coordinates: [90.4074, 23.7104],
        },
        priceRange: {
          min: 30,
          max: 50,
          currency: 'USD',
        },
        rating: { average: 3.5, count: 40 },
        amenities: ['wifi', 'parking'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
    ];

    // Test Transport - Tagged with isTestData
    const testTransport = [
      {
        type: 'bus',
        name: 'TEST - Express Bus Service',
        description: 'Test bus service for recommendation system',
        route: {
          from: {
            name: 'Dhaka Central',
            location: {
              type: 'Point',
              coordinates: [90.4125, 23.8103],
            },
          },
          to: {
            name: 'Chittagong',
            location: {
              type: 'Point',
              coordinates: [91.7832, 22.3569],
            },
          },
          duration: {
            estimated: '6 hours',
          },
        },
        pricing: {
          amount: 500,
          currency: 'BDT',
        },
        schedule: {
          departures: ['08:00', '14:00', '20:00'],
        },
        facilities: ['ac', 'wifi'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        type: 'train',
        name: 'TEST - Intercity Train',
        description: 'Test train service for recommendation system',
        route: {
          from: {
            name: 'Dhaka Railway',
            location: {
              type: 'Point',
              coordinates: [90.4125, 23.8103],
            },
          },
          to: {
            name: 'Sylhet',
            location: {
              type: 'Point',
              coordinates: [91.8687, 24.8949],
            },
          },
          duration: {
            estimated: '7 hours',
          },
        },
        pricing: {
          amount: 600,
          currency: 'BDT',
        },
        schedule: {
          departures: ['07:00', '14:00'],
        },
        facilities: ['ac', 'snacks'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        type: 'bus',
        name: 'TEST - Coastal Express',
        description: 'Test coastal bus for recommendation system',
        route: {
          from: {
            name: 'Chittagong',
            location: {
              type: 'Point',
              coordinates: [91.7832, 22.3569],
            },
          },
          to: {
            name: "Cox's Bazar",
            location: {
              type: 'Point',
              coordinates: [92.0058, 21.4272],
            },
          },
          duration: {
            estimated: '4 hours',
          },
        },
        pricing: {
          amount: 400,
          currency: 'BDT',
        },
        schedule: {
          departures: ['09:00', '13:00'],
        },
        facilities: ['ac', 'wifi', 'tv'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        type: 'rental-car',
        name: 'TEST - Private Car Rental',
        description: 'Test car rental for recommendation system',
        route: {
          from: {
            name: 'Dhaka',
            location: {
              type: 'Point',
              coordinates: [90.4125, 23.8103],
            },
          },
          to: {
            name: 'Chittagong',
            location: {
              type: 'Point',
              coordinates: [91.7832, 22.3569],
            },
          },
          duration: {
            estimated: '5 hours',
          },
        },
        pricing: {
          amount: 3000,
          currency: 'BDT',
          priceType: 'per-trip',
        },
        facilities: ['ac'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
      {
        type: 'bus',
        name: 'TEST - Budget Bus',
        description: 'Test budget bus for recommendation system',
        route: {
          from: {
            name: 'Dhaka',
            location: {
              type: 'Point',
              coordinates: [90.4125, 23.8103],
            },
          },
          to: {
            name: "Cox's Bazar",
            location: {
              type: 'Point',
              coordinates: [92.0058, 21.4272],
            },
          },
          duration: {
            estimated: '10 hours',
          },
        },
        pricing: {
          amount: 800,
          currency: 'BDT',
        },
        schedule: {
          departures: ['22:00'],
        },
        facilities: ['ac'],
        guideId: testGuide._id,
        approvalStatus: 'approved',
        isTestData: true,
      },
    ];

    // Insert test data
    const locations = await Location.insertMany(testLocations);
    console.log(`✅ Created ${locations.length} test locations`);

    const hotels = await Hotel.insertMany(testHotels);
    console.log(`✅ Created ${hotels.length} test hotels`);

    const transport = await Transport.insertMany(testTransport);
    console.log(`✅ Created ${transport.length} test transport options`);

    console.log('\n🎉 Recommendation test data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Locations: ${locations.length}`);
    console.log(`   - Hotels: ${hotels.length}`);
    console.log(`   - Transport: ${transport.length}`);
    console.log('\n💡 To remove this test data, run: npm run unseed-test');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
};

seedRecommendationTestData();
