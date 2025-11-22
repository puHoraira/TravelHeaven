import axios from 'axios';

/**
 * Railway Service - Integration with Shohoz Railway API
 * Handles train ticket search functionality
 */

const RAILWAY_API_BASE_URL = 'https://railspaapi.shohoz.com/v1.0/web';

/**
 * Search for available trains between two cities
 * @param {Object} params - Search parameters
 * @param {string} params.fromCity - Origin city name
 * @param {string} params.toCity - Destination city name
 * @param {string} params.dateOfJourney - Journey date in DD-MMM-YYYY format
 * @param {string} params.seatClass - Seat class (S_CHAIR, SNIGDHA, AC_S, etc.)
 * @param {string} params.bearerToken - Optional Bearer token for authentication
 * @param {string} params.deviceId - Optional device ID
 * @param {string} params.deviceKey - Optional device key
 * @returns {Promise<Object>} Train search results
 */
export const searchTrains = async ({ 
  fromCity, 
  toCity, 
  dateOfJourney, 
  seatClass = 'S_CHAIR', 
  bearerToken = null,
  deviceId = null,
  deviceKey = null
}) => {
  try {
    const url = `${RAILWAY_API_BASE_URL}/bookings/search-trips-v2`;
    
    const params = {
      from_city: fromCity,
      to_city: toCity,
      date_of_journey: dateOfJourney,
      seat_class: seatClass
    };

    console.log('🚂 Railway API Request:', { url, params, hasToken: !!bearerToken });

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Referer': 'https://eticket.railway.gov.bd/',
      'Origin': 'https://eticket.railway.gov.bd',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Add Bearer token if provided
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    // Add device ID and key if provided
    if (deviceId) {
      headers['X-Device-Id'] = deviceId;
    }
    if (deviceKey) {
      headers['X-Device-Key'] = deviceKey;
    }

    const response = await axios.get(url, {
      params,
      headers,
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.data) {
      const trains = response.data.data.trains || [];
      
      console.log(`✅ Found ${trains.length} train(s)`);
      
      // Format the response for easier consumption
      return {
        success: true,
        trains: trains.map(train => formatTrainData(train)),
        totalTrains: trains.length,
        selectedSeatClass: response.data.data.selected_seat_class
      };
    }

    return {
      success: false,
      trains: [],
      totalTrains: 0,
      message: 'No trains found'
    };

  } catch (error) {
    console.error('❌ Railway API Error:', error.message);
    
    if (error.response) {
      // API returned error response
      const status = error.response.status;
      
      if (status === 401) {
        // Authentication required - provide helpful message
        throw new Error(
          'Railway API requires authentication. Please note: ' +
          'Direct API access requires valid session tokens from Bangladesh Railway. ' +
          'Users should book directly at https://eticket.railway.gov.bd/'
        );
      } else {
        throw new Error(`Railway API error: ${status} - ${error.response.statusText}`);
      }
    } else if (error.request) {
      // No response received
      throw new Error('No response from Railway API. The service may be temporarily unavailable.');
    } else {
      // Request setup error
      throw new Error(`Failed to search trains: ${error.message}`);
    }
  }
};

/**
 * Format train data for consistent response structure
 * @param {Object} train - Raw train data from API
 * @returns {Object} Formatted train data
 */
const formatTrainData = (train) => {
  return {
    tripNumber: train.trip_number,
    trainModel: train.train_model,
    
    // Departure info
    departureDateTime: train.departure_date_time,
    departureDateTimeFull: train.departure_date_time_jd,
    departureDate: train.departure_full_date,
    
    // Arrival info
    arrivalDateTime: train.arrival_date_time,
    
    // Route info
    originCity: train.origin_city_name,
    destinationCity: train.destination_city_name,
    travelTime: train.travel_time,
    
    // Boarding points
    boardingPoints: train.boarding_points?.map(point => ({
      id: point.trip_point_id,
      locationId: point.location_id,
      name: point.location_name,
      time: point.location_time,
      date: point.location_date
    })) || [],
    
    // Seat types and availability
    seatTypes: train.seat_types?.map(seat => ({
      key: seat.key,
      type: seat.type,
      typeName: getSeatTypeName(seat.type),
      tripId: seat.trip_id,
      tripRouteId: seat.trip_route_id,
      routeId: seat.route_id,
      fare: parseFloat(seat.fare),
      vatPercent: seat.vat_percent,
      vatAmount: seat.vat_amount,
      totalFare: parseFloat(seat.fare) + seat.vat_amount,
      currency: 'BDT',
      availability: {
        online: seat.seat_counts?.online || 0,
        offline: seat.seat_counts?.offline || 0,
        total: (seat.seat_counts?.online || 0) + (seat.seat_counts?.offline || 0),
        available: (seat.seat_counts?.online || 0) > 0
      }
    })) || [],
    
    // Additional info
    isOpenForAll: train.is_open_for_all,
    isInternational: train.is_international === 1,
    isEidTrip: train.is_eid_trip === 1,
    
    // Parent route details
    parentRoute: train.parent_route ? {
      originCity: train.parent_route.origin_city_name,
      destinationCity: train.parent_route.destination_city_name,
      departureDate: train.parent_route.departure_date,
      departureTime: train.parent_route.departure_time,
      arrivalDate: train.parent_route.arrival_date,
      arrivalTime: train.parent_route.arrival_time
    } : null
  };
};

/**
 * Get human-readable seat type name
 * @param {string} type - Seat type code
 * @returns {string} Readable name
 */
const getSeatTypeName = (type) => {
  const seatTypeNames = {
    'S_CHAIR': 'Shulov Chair',
    'SNIGDHA': 'Snigdha',
    'AC_S': 'AC Seat',
    'AC_B': 'AC Berth',
    'F_SEAT': 'First Seat',
    'F_BERTH': 'First Berth',
    'SHOVAN': 'Shovan'
  };
  
  return seatTypeNames[type] || type;
};

/**
 * Format date for Railway API (DD-MMM-YYYY format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForRailwayAPI = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Get available seat classes
 * @returns {Array} List of seat class options
 */
export const getSeatClasses = () => {
  return [
    { value: 'S_CHAIR', label: 'Shulov Chair', description: 'Economy class seating' },
    { value: 'SNIGDHA', label: 'Snigdha', description: 'Premium seating with AC' },
    { value: 'AC_S', label: 'AC Seat', description: 'Air-conditioned seating' },
    { value: 'AC_B', label: 'AC Berth', description: 'Air-conditioned sleeping berth' },
    { value: 'F_SEAT', label: 'First Seat', description: 'First class seating' },
    { value: 'F_BERTH', label: 'First Berth', description: 'First class sleeping berth' },
    { value: 'SHOVAN', label: 'Shovan', description: 'Standard seating' }
  ];
};

export default {
  searchTrains,
  formatDateForRailwayAPI,
  getSeatClasses
};
