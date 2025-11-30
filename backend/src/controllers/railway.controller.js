import { searchTrains, formatDateForRailwayAPI, getSeatClasses, getTrainRoutes } from '../services/railway.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load railway config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const railwayConfigPath = path.join(__dirname, '../../.env.railway');
dotenv.config({ path: railwayConfigPath });

/**
 * Railway Controller - Handle train search requests
 */

/**
 * Search for trains between two cities
 * GET /api/railway/search
 * Query params: fromCity, toCity, date, seatClass
 */
export const searchRailwayRoutes = async (req, res) => {
  try {
    const { fromCity, toCity, date, seatClass, bearerToken, deviceId, deviceKey } = req.query;

    // Validation
    if (!fromCity || !toCity) {
      return res.status(400).json({
        success: false,
        message: 'From city and to city are required'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Journey date is required'
      });
    }

    // Use tokens from config file if not provided in request
    const finalBearerToken = bearerToken || process.env.RAILWAY_BEARER_TOKEN || null;
    const finalDeviceId = deviceId || process.env.RAILWAY_DEVICE_ID || null;
    const finalDeviceKey = deviceKey || process.env.RAILWAY_DEVICE_KEY || null;

    // Format date for Railway API (DD-MMM-YYYY)
    const formattedDate = formatDateForRailwayAPI(date);
    
    console.log(`🚂 Searching trains: ${fromCity} → ${toCity} on ${formattedDate}`, finalBearerToken ? '(with token)' : '(no token)');

    // Search trains
    const result = await searchTrains({
      fromCity,
      toCity,
      dateOfJourney: formattedDate,
      seatClass: seatClass || 'S_CHAIR',
      bearerToken: finalBearerToken,
      deviceId: finalDeviceId,
      deviceKey: finalDeviceKey
    });

    return res.json({
      success: true,
      data: {
        trains: result.trains,
        totalTrains: result.totalTrains,
        selectedSeatClass: result.selectedSeatClass,
        searchParams: {
          fromCity,
          toCity,
          date: formattedDate,
          seatClass: seatClass || 'S_CHAIR'
        }
      }
    });

  } catch (error) {
    console.error('Railway search error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to search trains',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get available seat classes
 * GET /api/railway/seat-classes
 */
export const getRailwaySeatClasses = async (req, res) => {
  try {
    const seatClasses = getSeatClasses();
    
    return res.json({
      success: true,
      data: seatClasses
    });
  } catch (error) {
    console.error('Get seat classes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get seat classes'
    });
  }
};

/**
 * Get railway booking information
 * GET /api/railway/info
 */
export const getRailwayInfo = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        provider: 'Bangladesh Railway (via Shohoz)',
        bookingUrl: 'https://eticket.railway.gov.bd/',
        supportedCities: [
          'Dhaka', 'Chittagong', 'Cox\'s Bazar', 'Sylhet', 'Rajshahi',
          'Khulna', 'Rangpur', 'Dinajpur', 'Mymensingh', 'Comilla'
        ],
        features: [
          'Real-time seat availability',
          'Multiple seat class options',
          'Direct booking links',
          'Train schedule information'
        ],
        note: 'Book directly through Bangladesh Railway official website'
      }
    });
  } catch (error) {
    console.error('Get railway info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get railway information'
    });
  }
};

/**
 * Get route details for a specific train
 * POST /api/railway/routes
 * Body: { trainNumber, date }
 */
export const getAllTrainRoutes = async (req, res) => {
  try {
    const { trainNumber, date, bearerToken, deviceId, deviceKey } = req.body;
    
    if (!trainNumber) {
      return res.status(400).json({
        success: false,
        message: 'Train number is required'
      });
    }

    // Use tokens from config file if not provided in request
    const finalBearerToken = bearerToken || process.env.RAILWAY_BEARER_TOKEN || null;
    const finalDeviceId = deviceId || process.env.RAILWAY_DEVICE_ID || null;
    const finalDeviceKey = deviceKey || process.env.RAILWAY_DEVICE_KEY || null;

    console.log(`🚂 Fetching routes for train ${trainNumber} on ${date || 'today'}`);
    console.log('🔑 Has Bearer Token:', !!finalBearerToken, finalBearerToken ? `(${finalBearerToken.substring(0, 20)}...)` : '(none)');
    console.log('🔑 Has Device ID:', !!finalDeviceId);
    console.log('🔑 Has Device Key:', !!finalDeviceKey);

    // Check if we have all required tokens
    if (!finalBearerToken || !finalDeviceId || !finalDeviceKey) {
      return res.status(400).json({
        success: false,
        message: 'Railway API requires authentication. Please provide Bearer Token, Device ID, and Device Key.',
        missing: {
          bearerToken: !finalBearerToken,
          deviceId: !finalDeviceId,
          deviceKey: !finalDeviceKey
        }
      });
    }

    // Get train routes
    const result = await getTrainRoutes(trainNumber, date, {
      bearerToken: finalBearerToken,
      deviceId: finalDeviceId,
      deviceKey: finalDeviceKey
    });

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get train routes error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get train routes',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
