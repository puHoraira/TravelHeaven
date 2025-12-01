/**
 * Safe Database Initialization
 * Creates admin and guide users ONLY if they don't exist
 * Does NOT delete any existing data
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { DatabaseConnection } from '../config/database.js';
import { User } from '../models/User.js';

dotenv.config();

const initializeUsers = async () => {
  try {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    console.log('🔧 Initializing essential users...');

    // Create admin if not exists
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      const adminPassword = await bcrypt.hash('adminpass', 10);
      admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      console.log('✅ Admin user created');
      console.log('   Email: admin@example.com');
      console.log('   Password: adminpass');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create guide if not exists
    let guide = await User.findOne({ email: 'guide1@example.com' });
    if (!guide) {
      const guidePassword = await bcrypt.hash('guidepass', 10);
      guide = await User.create({
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
          phone: '+81-90-1234-5678'
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
      console.log('✅ Guide user created');
      console.log('   Email: guide1@example.com');
      console.log('   Password: guidepass');
    } else {
      console.log('ℹ️  Guide user already exists');
    }

    // Create test user if not exists
    let user = await User.findOne({ email: 'user1@example.com' });
    if (!user) {
      const userPassword = await bcrypt.hash('userpass', 10);
      user = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password: userPassword,
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      });
      console.log('✅ Test user created');
      console.log('   Email: user1@example.com');
      console.log('   Password: userpass');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    console.log('\n🎉 User initialization complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin: admin@example.com`);
    console.log(`   - Guide: guide1@example.com`);
    console.log(`   - User: user1@example.com`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initializeUsers();
