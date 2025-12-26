import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { DatabaseConnection } from '../config/database.js';
import { User } from '../models/User.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';

dotenv.config();

// Safety guard: prevent accidental destructive runs
const { NODE_ENV, ALLOW_DESTRUCTIVE_SEED } = process.env;
if (NODE_ENV === 'production') {
  console.error('❌ Refusing to run: destructive seed is blocked in production. Set NODE_ENV=development.');
  process.exit(1);
}
if (ALLOW_DESTRUCTIVE_SEED !== 'true') {
  console.error('❌ Refusing to run: set ALLOW_DESTRUCTIVE_SEED=true to confirm you want to wipe the database.');
  process.exit(1);
}

const seed = async () => {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  console.log('⚠️  WARNING: This script will DELETE ALL DATA in the database!');
  console.log('⚠️  This should ONLY be used for initial setup or testing!');
  console.log('⚠️  Use "npm run cleanup-seed" instead for safe seeding.');
  console.log('');
  console.log('Waiting 5 seconds... Press Ctrl+C to cancel.');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Clear collections (DANGEROUS - only for initial dev setup)
  console.log('🗑️  Deleting all data...');
  await Promise.all([
    User.deleteMany({}),
    Location.deleteMany({}),
    Hotel.deleteMany({}),
    Transport.deleteMany({}),
  ]);
  console.log('✅ All data deleted');

  // Create admin
  const adminPassword = await bcrypt.hash('adminpass', 10);
  const admin = await User.create({ username: 'admin', email: 'admin@example.com', password: adminPassword, role: 'admin' });

  // Create guide
  const guidePassword = await bcrypt.hash('guidepass', 10);
  const guide = await User.create({
    username: 'guide1',
    email: 'guide1@example.com',
    password: guidePassword,
    role: 'guide',
    profile: {
      firstName: 'John',
      lastName: 'Traveler',
      bio: 'Experienced travel guide with 10 years of expertise in Asian destinations.',
      location: 'Tokyo, Japan',
      languages: ['English', 'Japanese', 'Spanish'],
      specialties: ['Cultural Tours', 'Food Tours', 'Adventure Travel'],
    },
    guideInfo: {
      experience: '10+ years',
      priceRange: {
        min: 100,
        max: 300,
        currency: 'USD',
      },
      availability: 'Available weekdays and weekends',
      contactMethods: {
        phone: '+81-90-1234-5678',
        email: 'guide1@example.com',
        whatsapp: '+819012345678',
      },
      rating: {
        average: 4.5,
        count: 0,
      },
    },
  });

  // Create a pending location
  const location = await Location.create({
    name: 'Sample Beach',
    description: 'Beautiful sandy beach',
    country: 'Countryland',
    city: 'Beach City',
    guideId: guide._id,
    approvalStatus: 'pending',
  });

  // Create a pending hotel
  const hotel = await Hotel.create({
    name: 'Sea View Hotel',
    description: 'Comfortable stay near the beach',
    locationId: location._id,
    guideId: guide._id,
    approvalStatus: 'pending',
  });

  // Create a pending transport
  const transport = await Transport.create({
    name: 'Beach Shuttle',
    type: 'bus',
    locationId: location._id,
    guideId: guide._id,
    approvalStatus: 'pending',
  });

  // Create user for itinerary demo
  const userPassword = await bcrypt.hash('userpass', 10);
  const user = await User.create({ username: 'user1', email: 'user1@example.com', password: userPassword, role: 'user' });

  // Create a sample public itinerary
  const { Itinerary } = await import('../models/Itinerary.js');
  const itinerary = await Itinerary.create({
    title: 'Beach Getaway Trip',
    description: 'A relaxing 3-day beach vacation',
    ownerId: user._id,
    isPublic: true,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    days: [
      {
        dayNumber: 1,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        title: 'Arrival',
        stops: [
          {
            locationId: location._id,
            order: 1,
            notes: 'Check out the beautiful beach',
          },
          {
            hotelId: hotel._id,
            order: 2,
            notes: 'Check-in at hotel',
          },
        ],
      },
    ],
    budget: {
      total: 1000,
      currency: 'USD',
      expenses: [],
    },
    status: 'planning',
    completeness: 70,
  });

  console.log('✅ Seeding complete');
  console.log('Admin -> admin@example.com / adminpass');
  console.log('Guide -> guide1@example.com / guidepass');
  console.log('User -> user1@example.com / userpass');
  console.log('Sample itinerary created (public, ID:', itinerary._id.toString(), ')');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
