/**
 * Cleanup Test Data and Seed Proper Diverse Locations
 * Removes TEST locations and adds realistic diverse data
 */

import dotenv from 'dotenv';
import { DatabaseConnection } from '../config/database.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

dotenv.config();

const cleanupAndSeed = async () => {
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    console.log('🌟 Seeding diverse realistic locations (preserving existing data)...');

    // Create a test guide user if not exists
    let guideUser = await User.findOne({ email: 'guide@test.com' });
    if (!guideUser) {
      guideUser = await User.create({
        username: 'systemguide',
        email: 'guide@test.com',
        password: 'hashedpassword123',
        role: 'guide',
        profile: {
          firstName: 'System',
          lastName: 'Guide',
          phone: '+8801234567890'
        }
      });
    }

    const guideId = guideUser._id;

    // Diverse locations with proper categories
    const locations = [
      // HISTORICAL
      {
        name: 'Lalbagh Fort',
        description: 'Historical Mughal fort complex in Old Dhaka, featuring beautiful architecture and museum',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Lalbagh Road, Old Dhaka',
        coordinates: { latitude: 23.7189, longitude: 90.3869 },
        category: 'historical',
        entryFee: { amount: 20, currency: 'BDT' },
        rating: { average: 4.2, count: 856 },
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Ahsan Manzil',
        description: 'Pink Palace - Historical residence of the Nawab of Dhaka, now a museum',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Kumartoli, Old Dhaka',
        coordinates: { latitude: 23.7081, longitude: 90.4054 },
        category: 'historical',
        entryFee: { amount: 30, currency: 'BDT' },
        rating: { average: 4.4, count: 1203 },
        guideId,
        approvalStatus: 'approved'
      },
      // CULTURAL
      {
        name: 'National Museum',
        description: 'Largest museum in Bangladesh showcasing rich cultural heritage and artifacts',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Shahbagh',
        coordinates: { latitude: 23.7391, longitude: 90.3953 },
        category: 'cultural',
        entryFee: { amount: 50, currency: 'BDT' },
        rating: { average: 4.3, count: 645 },
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Dhakeshwari Temple',
        description: 'Ancient Hindu temple, national temple of Bangladesh with beautiful architecture',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Dhakeshwari Road',
        coordinates: { latitude: 23.7249, longitude: 90.3823 },
        category: 'cultural',
        entryFee: { amount: 0, currency: 'BDT' },
        rating: { average: 4.5, count: 432 },
        guideId,
        approvalStatus: 'approved'
      },
      // NATURAL
      {
        name: 'Botanical Garden',
        description: 'Lush green botanical garden with diverse plant species, lakes, and walking trails',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Mirpur',
        coordinates: { latitude: 23.8075, longitude: 90.3583 },
        category: 'natural',
        entryFee: { amount: 10, currency: 'BDT' },
        rating: { average: 4.1, count: 789 },
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Hatirjheel Lake',
        description: 'Scenic lake with waterfront walkways, perfect for evening strolls and boat rides',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Tejgaon',
        coordinates: { latitude: 23.7547, longitude: 90.4022 },
        category: 'natural',
        entryFee: { amount: 0, currency: 'BDT' },
        rating: { average: 4.3, count: 1567 },
        guideId,
        approvalStatus: 'approved'
      },
      // ADVENTURE
      {
        name: 'Nandan Park',
        description: 'Adventure park with rides, boating, and outdoor activities for all ages',
        country: 'Bangladesh',
        city: 'Dhaka',
        address: 'Ganakbari, Savar',
        coordinates: { latitude: 23.8520, longitude: 90.2711 },
        category: 'adventure',
        entryFee: { amount: 100, currency: 'BDT' },
        rating: { average: 4.0, count: 923 },
        guideId,
        approvalStatus: 'approved'
      },
      // BEACH (keep one)
      {
        name: 'Patenga Beach',
        description: 'Beautiful sea beach in Chittagong, popular for sunset views and seafood',
        country: 'Bangladesh',
        city: 'Chittagong',
        address: 'Patenga',
        coordinates: { latitude: 22.2364, longitude: 91.7989 },
        category: 'beach',
        entryFee: { amount: 0, currency: 'BDT' },
        rating: { average: 4.2, count: 2134 },
        guideId,
        approvalStatus: 'approved'
      },
      // MOUNTAIN
      {
        name: 'Sajek Valley',
        description: 'Stunning hill station with mountain views, clouds, and indigenous culture',
        country: 'Bangladesh',
        city: 'Rangamati',
        address: 'Sajek, Rangamati Hill District',
        coordinates: { latitude: 23.3821, longitude: 92.2945 },
        category: 'mountain',
        entryFee: { amount: 50, currency: 'BDT' },
        rating: { average: 4.8, count: 3421 },
        guideId,
        approvalStatus: 'approved'
      }
    ];

    // Insert locations only if they don't exist
    let createdCount = 0;
    for (const locationData of locations) {
      const exists = await Location.findOne({ name: locationData.name });
      if (!exists) {
        await Location.create(locationData);
        createdCount++;
      }
    }
    console.log(`✅ Added ${createdCount} new locations (${locations.length - createdCount} already existed)`);

    // Hotels for each location
    const hotels = [
      // Dhaka Hotels
      {
        name: 'Hotel Ruposhi Bangla',
        description: 'Luxury hotel in heart of Dhaka with modern amenities',
        location: { 
          type: 'Point', 
          coordinates: [90.3953, 23.7391] 
        },
        address: 'Shahbagh, Dhaka',
        priceRange: { min: 5000, max: 12000, currency: 'BDT' },
        rating: { average: 4.4, count: 234 },
        facilities: ['wifi', 'parking', 'restaurant', 'gym'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Hotel 71',
        description: 'Mid-range hotel near Old Dhaka, convenient for historical sites',
        location: { 
          type: 'Point', 
          coordinates: [90.4054, 23.7081] 
        },
        address: 'Sadarghat, Dhaka',
        priceRange: { min: 2000, max: 4000, currency: 'BDT' },
        rating: { average: 4.0, count: 156 },
        facilities: ['wifi', 'ac', 'restaurant'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Budget Inn Dhaka',
        description: 'Affordable stay option for budget travelers',
        location: { 
          type: 'Point', 
          coordinates: [90.3823, 23.7249] 
        },
        address: 'Dhakeshwari, Dhaka',
        priceRange: { min: 800, max: 1500, currency: 'BDT' },
        rating: { average: 3.8, count: 89 },
        facilities: ['wifi', 'ac'],
        guideId,
        approvalStatus: 'approved'
      },
      // Chittagong Hotel
      {
        name: 'Sea Crown Hotel',
        description: 'Beachfront hotel with ocean views and seafood restaurant',
        location: { 
          type: 'Point', 
          coordinates: [91.7989, 22.2364] 
        },
        address: 'Patenga, Chittagong',
        priceRange: { min: 3000, max: 7000, currency: 'BDT' },
        rating: { average: 4.3, count: 198 },
        facilities: ['wifi', 'parking', 'restaurant', 'sea-view'],
        guideId,
        approvalStatus: 'approved'
      },
      // Sajek Resort
      {
        name: 'Sajek Resort',
        description: 'Mountain resort with panoramic valley views',
        location: { 
          type: 'Point', 
          coordinates: [92.2945, 23.3821] 
        },
        address: 'Sajek Valley, Rangamati',
        priceRange: { min: 4000, max: 9000, currency: 'BDT' },
        rating: { average: 4.6, count: 512 },
        facilities: ['wifi', 'restaurant', 'mountain-view', 'bonfire'],
        guideId,
        approvalStatus: 'approved'
      }
    ];

    // Insert hotels only if they don't exist
    let hotelCount = 0;
    for (const hotelData of hotels) {
      const exists = await Hotel.findOne({ name: hotelData.name });
      if (!exists) {
        await Hotel.create(hotelData);
        hotelCount++;
      }
    }
    console.log(`✅ Added ${hotelCount} new hotels (${hotels.length - hotelCount} already existed)`);

    // Transport options
    const transport = [
      {
        name: 'Dhaka Metro Rail',
        type: 'train',
        pricing: { amount: 50, currency: 'BDT' },
        route: {
          from: { 
            name: 'Uttara',
            address: 'Uttara Station',
            location: { type: 'Point', coordinates: [90.3837, 23.8759] }
          },
          to: { 
            name: 'Motijheel',
            address: 'Motijheel Station',
            location: { type: 'Point', coordinates: [90.4180, 23.7330] }
          }
        },
        facilities: ['ac', 'wifi'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Green Line Bus Service',
        type: 'bus',
        pricing: { amount: 500, currency: 'BDT' },
        route: {
          from: { 
            name: 'Gabtoli',
            address: 'Gabtoli Bus Terminal',
            location: { type: 'Point', coordinates: [90.3478, 23.7783] }
          },
          to: { 
            name: 'Chittagong',
            address: 'Dampara Bus Stand',
            location: { type: 'Point', coordinates: [91.8325, 22.3569] }
          }
        },
        facilities: ['ac', 'wifi', 'toilet'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Sajek Transport',
        type: 'rental-car',
        pricing: { amount: 3500, currency: 'BDT' },
        route: {
          from: { 
            name: 'Chittagong City',
            address: 'GEC Circle',
            location: { type: 'Point', coordinates: [91.8325, 22.3569] }
          },
          to: { 
            name: 'Sajek Valley',
            address: 'Sajek Valley Entry Point',
            location: { type: 'Point', coordinates: [92.2945, 23.3821] }
          }
        },
        facilities: ['ac', 'music'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'City Taxi Service',
        type: 'taxi',
        pricing: { amount: 500, currency: 'BDT' },
        route: {
          from: { 
            name: 'Hazrat Shahjalal Airport',
            address: 'Airport Road',
            location: { type: 'Point', coordinates: [90.3978, 23.8433] }
          },
          to: { 
            name: 'City Center',
            address: 'Shahbagh',
            location: { type: 'Point', coordinates: [90.3953, 23.7391] }
          }
        },
        facilities: ['ac'],
        guideId,
        approvalStatus: 'approved'
      },
      {
        name: 'Dhaka-Chittagong Train',
        type: 'train',
        pricing: { amount: 700, currency: 'BDT' },
        route: {
          from: { 
            name: 'Kamalapur',
            address: 'Kamalapur Railway Station',
            location: { type: 'Point', coordinates: [90.4209, 23.7307] }
          },
          to: { 
            name: 'Chittagong',
            address: 'Chittagong Railway Station',
            location: { type: 'Point', coordinates: [91.8320, 22.3571] }
          }
        },
        facilities: ['ac', 'reclining-seat'],
        guideId,
        approvalStatus: 'approved'
      }
    ];

    // Insert transport only if they don't exist
    let transportCount = 0;
    for (const transportData of transport) {
      const exists = await Transport.findOne({ name: transportData.name });
      if (!exists) {
        await Transport.create(transportData);
        transportCount++;
      }
    }
    console.log(`✅ Added ${transportCount} new transport options (${transport.length - transportCount} already existed)`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   ✨ Locations: ${createdCount}`);
    console.log(`      - Historical: 2`);
    console.log(`      - Cultural: 2`);
    console.log(`      - Natural: 2`);
    console.log(`      - Adventure: 1`);
    console.log(`      - Beach: 1`);
    console.log(`      - Mountain: 1`);
    console.log(`   🏨 Hotels: ${hotelCount}`);
    console.log(`   🚗 Transport: ${transportCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanupAndSeed();
