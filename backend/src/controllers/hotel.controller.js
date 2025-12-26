import { HotelRepository } from '../patterns/Repository.js';
import { ensureGuideApproved } from '../utils/guide.js';

const hotelRepo = new HotelRepository();

/**
 * Create new hotel (Guide only)
 */
export const createHotel = async (req, res) => {
  try {
    console.log('\n\n🔥🔥🔥 [createHotel] ENDPOINT CALLED 🔥🔥🔥\n');
    if (!ensureGuideApproved(req, res)) return;

    // Parse JSON fields from FormData
    const bodyData = { ...req.body };
    ['location', 'address', 'contactInfo', 'priceRange', 'amenities'].forEach(field => {
      if (bodyData[field] && typeof bodyData[field] === 'string') {
        try {
          bodyData[field] = JSON.parse(bodyData[field]);
        } catch (e) {
          console.error(`Failed to parse ${field}:`, e);
        }
      }
    });

    // Parse rooms from FormData format: rooms[0][fieldName]
    const rooms = [];
    let roomIndex = 0;
    
    console.log('[createHotel] ===== ROOM PARSING START =====');
    console.log('[createHotel] Room fields in body:', Object.keys(bodyData).filter(k => k.startsWith('rooms[')));
    console.log('[createHotel] Total files received:', req.files?.length);
    console.log('[createHotel] Files:', req.files?.map(f => ({ 
      fieldname: f.fieldname, 
      mongoId: f.mongoId ? 'YES' : 'NO',
      originalname: f.originalname 
    })));
    
    while (bodyData[`rooms[${roomIndex}][roomType]`]) {
      const room = {
        roomType: bodyData[`rooms[${roomIndex}][roomType]`],
        bedType: bodyData[`rooms[${roomIndex}][bedType]`] || '',
        capacity: parseInt(bodyData[`rooms[${roomIndex}][capacity]`]) || 1,
        pricePerNight: parseFloat(bodyData[`rooms[${roomIndex}][pricePerNight]`]) || 0,
        currency: bodyData[`rooms[${roomIndex}][currency]`] || 'BDT',
        notes: bodyData[`rooms[${roomIndex}][notes]`] || '',
        amenities: [],
        photos: []
      };

      // Collect amenities for this room
      Object.keys(bodyData).forEach(key => {
        if (key.startsWith(`rooms[${roomIndex}][amenities]`)) {
          const amenity = bodyData[key];
          if (amenity && !room.amenities.includes(amenity)) {
            room.amenities.push(amenity);
          }
        }
      });

      // Collect photos for this room from req.files
      if (req.files && req.files.length > 0) {
        const roomPhotos = req.files.filter(file => 
          file.fieldname === `rooms[${roomIndex}][photos]` && file.mongoId
        );
        console.log(`[createHotel] Room ${roomIndex}: Found ${roomPhotos.length} photos with fieldname "rooms[${roomIndex}][photos]"`);
        room.photos = roomPhotos.map(file => ({
          file: file.mongoId,
          caption: file.originalname
        }));
      } else {
        console.log(`[createHotel] Room ${roomIndex}: No files received`);
      }

      rooms.push(room);
      roomIndex++;
    }
    
    console.log('[createHotel] ===== ROOM PARSING END =====');
    console.log('[createHotel] Total rooms parsed:', rooms.length);
    console.log('[createHotel] Rooms with photos:', rooms.filter(r => r.photos.length > 0).length);

    // Strict validation
    const errors = [];
    
    if (!bodyData.name || bodyData.name.trim().length < 3) {
      errors.push('Hotel name must be at least 3 characters');
    }
    
    if (!bodyData.description || bodyData.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    
    // Validate location (GeoJSON coordinates)
    if (!bodyData.location || !bodyData.location.coordinates || bodyData.location.coordinates.length !== 2) {
      errors.push('Valid location coordinates [longitude, latitude] are required');
    } else {
      const [lon, lat] = bodyData.location.coordinates;
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }
    
    // Validate price range
    if (!bodyData.priceRange || typeof bodyData.priceRange.min !== 'number' || bodyData.priceRange.min < 0) {
      errors.push('Valid minimum price is required (must be >= 0)');
    }
    
    if (bodyData.priceRange && bodyData.priceRange.max && bodyData.priceRange.max < bodyData.priceRange.min) {
      errors.push('Maximum price must be greater than minimum price');
    }
    
    // Validate amenities
    if (!bodyData.amenities || !Array.isArray(bodyData.amenities) || bodyData.amenities.length === 0) {
      errors.push('At least one amenity/facility is required');
    }
    
    // Validate contact info
    if (!bodyData.contactInfo || (!bodyData.contactInfo.phone && !bodyData.contactInfo.email)) {
      errors.push('At least one contact method (phone or email) is required');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    const hotelData = {
      name: bodyData.name.trim(),
      description: bodyData.description.trim(),
      location: {
        type: 'Point',
        coordinates: bodyData.location.coordinates
      },
      address: bodyData.address || '',
      priceRange: {
        min: parseFloat(bodyData.priceRange.min),
        max: bodyData.priceRange.max ? parseFloat(bodyData.priceRange.max) : parseFloat(bodyData.priceRange.min) * 2,
        currency: bodyData.priceRange.currency || 'BDT'
      },
      amenities: bodyData.amenities,
      contactInfo: bodyData.contactInfo,
      rooms: rooms,
      guideId: req.user._id,
      approvalStatus: 'pending',
      rejectionReason: null,
      resubmittedAt: null,
    };

    // Optional fields
    if (bodyData.locationId) hotelData.locationId = bodyData.locationId;

    // Handle uploaded hotel images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      const hotelImages = req.files.filter(file => 
        file.fieldname === 'images' && file.mongoId
      );
      hotelData.images = hotelImages.map(file => ({
        file: file.mongoId,
        caption: file.originalname,
      }));
    }

    const hotel = await hotelRepo.create(hotelData);

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully. Waiting for admin approval.',
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create hotel',
      error: error.message,
    });
  }
};

/**
 * Get all approved hotels
 */
export const getHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10, locationId, minRating, guideId } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (guideId) filter.guideId = guideId;

    const result = await hotelRepo.findApproved(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['locationId', 'guideId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

/**
 * Get hotel by ID
 */
export const getHotelById = async (req, res) => {
  try {
    const hotel = await hotelRepo.findById(req.params.id, ['locationId', 'guideId']);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    // Populate file references in images + room photos
    await hotel.populate(['images.file', 'rooms.photos.file']);

    // Only show approved hotels to non-admin users / public
    const role = req.user?.role || 'public';
    if (role !== 'admin' && hotel.approvalStatus !== 'approved') {
      if (role === 'guide' && hotel.guideId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (role === 'public') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hotel',
      error: error.message,
    });
  }
};

/**
 * Update hotel (Guide only - own hotels)
 */
export const updateHotel = async (req, res) => {
  try {
    console.log('\n\n🔥🔥🔥 [updateHotel] ENDPOINT CALLED 🔥🔥🔥\n');
    if (!ensureGuideApproved(req, res)) return;

    const hotel = await hotelRepo.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && hotel.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own hotels',
      });
    }

    const updateData = { ...req.body };

    // Parse complex fields if they arrive as JSON strings (from multipart forms)
    const tryParse = (value) => {
      if (value == null) return value;
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (_) {
        return value;
      }
    };

    if (updateData.amenities) {
      // allow comma-separated or JSON array
      const parsed = tryParse(updateData.amenities);
      updateData.amenities = Array.isArray(parsed)
        ? parsed
        : String(parsed)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (updateData.location) updateData.location = tryParse(updateData.location);
    if (updateData.priceRange) updateData.priceRange = tryParse(updateData.priceRange);
    if (updateData.contactInfo) updateData.contactInfo = tryParse(updateData.contactInfo);
    if (updateData.address) updateData.address = tryParse(updateData.address);

    // Parse rooms from FormData format if provided
    const bodyData = { ...req.body };
    let roomIndex = 0;
    const rooms = [];
    
    console.log('[updateHotel] ===== ROOM PARSING START =====');
    console.log('[updateHotel] Room fields in body:', Object.keys(bodyData).filter(k => k.startsWith('rooms[')));
    console.log('[updateHotel] Total files received:', req.files?.length);
    console.log('[updateHotel] Files:', req.files?.map(f => ({ 
      fieldname: f.fieldname, 
      mongoId: f.mongoId ? 'YES' : 'NO',
      originalname: f.originalname 
    })));
    
    while (bodyData[`rooms[${roomIndex}][roomType]`]) {
      const room = {
        roomType: bodyData[`rooms[${roomIndex}][roomType]`],
        bedType: bodyData[`rooms[${roomIndex}][bedType]`] || '',
        capacity: parseInt(bodyData[`rooms[${roomIndex}][capacity]`]) || 1,
        pricePerNight: parseFloat(bodyData[`rooms[${roomIndex}][pricePerNight]`]) || 0,
        currency: bodyData[`rooms[${roomIndex}][currency]`] || 'BDT',
        notes: bodyData[`rooms[${roomIndex}][notes]`] || '',
        amenities: [],
        photos: []
      };

      // Collect amenities for this room
      Object.keys(bodyData).forEach(key => {
        if (key.startsWith(`rooms[${roomIndex}][amenities]`)) {
          const amenity = bodyData[key];
          if (amenity && !room.amenities.includes(amenity)) {
            room.amenities.push(amenity);
          }
        }
      });

      // Collect photos for this room from req.files
      if (req.files && req.files.length > 0) {
        const roomPhotos = req.files.filter(file => 
          file.fieldname === `rooms[${roomIndex}][photos]` && file.mongoId
        );
        console.log(`[updateHotel] Room ${roomIndex}: Found ${roomPhotos.length} photos with fieldname "rooms[${roomIndex}][photos]"`);
        room.photos = roomPhotos.map(file => ({
          file: file.mongoId,
          caption: file.originalname
        }));
      } else {
        console.log(`[updateHotel] Room ${roomIndex}: No files or photos`);
      }

      rooms.push(room);
      roomIndex++;
    }
    
    console.log('[updateHotel] ===== ROOM PARSING END =====');
    console.log('[updateHotel] Total rooms parsed:', rooms.length);
    console.log('[updateHotel] Rooms with photos:', rooms.filter(r => r.photos.length > 0).length);

    if (rooms.length > 0) {
      updateData.rooms = rooms;
    }

    // Handle uploaded hotel images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      const hotelImages = req.files.filter(file => 
        file.fieldname === 'images' && file.mongoId
      );
      if (hotelImages.length > 0) {
        const newImages = hotelImages.map(file => ({
          file: file.mongoId,
          caption: file.originalname,
        }));
        updateData.images = [...(hotel.images || []), ...newImages];
      }
    }

    // Reset approval status if content changed
    if (req.user.role === 'guide') {
      updateData.approvalStatus = 'pending';
      updateData.rejectionReason = null;
      updateData.resubmittedAt = new Date();
    }

    const updatedHotel = await hotelRepo.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: updatedHotel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update hotel',
      error: error.message,
    });
  }
};

/**
 * Delete hotel
 */
export const deleteHotel = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const hotel = await hotelRepo.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && hotel.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own hotels',
      });
    }

    await hotelRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete hotel',
      error: error.message,
    });
  }
};

/**
 * Get guide's own hotels
 */
export const getMyHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log('🔍 getMyHotels called by user:', req.user._id);
    console.log('Query params:', { page, limit });

    const result = await hotelRepo.findByGuide(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['locationId'],
    });

    console.log('📊 Found hotels:', result.data.length);
    console.log('Hotels:', result.data.map(h => ({ id: h._id, name: h.name, guideId: h.guideId })));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('❌ Error in getMyHotels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};

/**
 * Add a room to a hotel (Guide owner or Admin)
 */
export const addRoomToHotel = async (req, res) => {
  try {
    const hotel = await hotelRepo.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    // Ownership or admin
    if (req.user.role === 'guide' && hotel.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only modify your own hotels' });
    }

    const room = {
      roomType: req.body.roomType,
      bedType: req.body.bedType,
      capacity: req.body.capacity,
      pricePerNight: req.body.pricePerNight,
      currency: req.body.currency || 'USD',
      amenities: req.body.amenities || [],
      notes: req.body.notes || '',
      photos: [],
    };

    // Handle room photos via upload field name `photos`
    if (req.files && req.files.length > 0) {
      room.photos = req.files
        .filter((f) => f?.mongoId)
        .map((f) => ({ file: f.mongoId, caption: f.originalname }));
    }

    hotel.rooms = hotel.rooms || [];
    hotel.rooms.push(room);

    // Content changed -> set pending if guide
    if (req.user.role === 'guide') {
      hotel.approvalStatus = 'pending';
      hotel.rejectionReason = null;
      hotel.resubmittedAt = new Date();
    }

    await hotel.save();

    res.status(201).json({ success: true, message: 'Room added', data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add room', error: error.message });
  }
};

/**
 * Update a room in a hotel
 */
export const updateRoomInHotel = async (req, res) => {
  try {
    console.log('\n\n🔥🔥🔥 [updateRoomInHotel] ENDPOINT CALLED 🔥🔥🔥');
    console.log('[updateRoomInHotel] Hotel ID:', req.params.id);
    console.log('[updateRoomInHotel] Room Index:', req.params.roomIndex);
    console.log('[updateRoomInHotel] req.files:', req.files?.length);
    console.log('[updateRoomInHotel] Files details:', req.files?.map(f => ({ fieldname: f.fieldname, mongoId: !!f.mongoId, originalname: f.originalname })));
    console.log('[updateRoomInHotel] req.body:', req.body);
    
    const hotel = await hotelRepo.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (req.user.role === 'guide' && hotel.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only modify your own hotels' });
    }

    const idx = Number(req.params.roomIndex);
    if (!hotel.rooms || idx < 0 || idx >= hotel.rooms.length) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const target = hotel.rooms[idx];
    const updates = ['roomType','bedType','capacity','pricePerNight','currency','amenities','notes'];
    updates.forEach((k) => {
      if (req.body[k] !== undefined) target[k] = req.body[k];
    });

    if (req.files && req.files.length > 0) {
      const newPhotos = req.files
        .filter((f) => f?.mongoId)
        .map((f) => ({ file: f.mongoId, caption: f.originalname }));
      target.photos = [...(target.photos || []), ...newPhotos];
    }

    if (req.user.role === 'guide') {
      hotel.approvalStatus = 'pending';
      hotel.rejectionReason = null;
      hotel.resubmittedAt = new Date();
    }

    await hotel.save();
    res.json({ success: true, message: 'Room updated', data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update room', error: error.message });
  }
};

/**
 * Delete a room from a hotel
 */
export const deleteRoomFromHotel = async (req, res) => {
  try {
    const hotel = await hotelRepo.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (req.user.role === 'guide' && hotel.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only modify your own hotels' });
    }

    const idx = Number(req.params.roomIndex);
    if (!hotel.rooms || idx < 0 || idx >= hotel.rooms.length) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    hotel.rooms.splice(idx, 1);

    if (req.user.role === 'guide') {
      hotel.approvalStatus = 'pending';
      hotel.rejectionReason = null;
      hotel.resubmittedAt = new Date();
    }

    await hotel.save();
    res.json({ success: true, message: 'Room deleted', data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete room', error: error.message });
  }
};

/**
 * Find nearby hotels using GPS coordinates
 */
export const findNearbyHotels = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5, locationName } = req.query;

    let hotels = [];

    // GPS-based search - EXACTLY like Transport
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const maxDistanceKm = parseFloat(maxDistance);

      console.log('🏨 Finding hotels near:', { latitude, longitude, maxDistanceKm });

      // Find ALL approved hotels with location coordinates (checking both field names)
      const Hotel = (await import('../models/Hotel.js')).Hotel;
      const allHotels = await Hotel.find({
        approvalStatus: 'approved',
        $or: [
          { 'location.coordinates': { $exists: true } },
          { 'coordinates.coordinates': { $exists: true } }
        ]
      })
      .populate('locationId')
      .populate('guideId', 'name email')
      .lean();

      console.log(`📦 Found ${allHotels.length} approved hotels`);
      console.log('First hotel sample:', allHotels[0] ? JSON.stringify({
        name: allHotels[0].name,
        hasLocation: !!allHotels[0].location,
        hasCoordinates: !!allHotels[0].coordinates,
        locationCoords: allHotels[0].location?.coordinates,
        coordsCoords: allHotels[0].coordinates?.coordinates
      }, null, 2) : 'No hotels found');

      // Calculate distance for each hotel and filter
      hotels = allHotels
        .map(hotel => {
          // Check both possible field names
          const coords = hotel.location?.coordinates || hotel.coordinates?.coordinates;
          
          if (coords && coords.length === 2) {
            const [hotelLon, hotelLat] = coords;
            const distance = calculateDistance(
              latitude,
              longitude,
              hotelLat,
              hotelLon
            );
            
            console.log(`🏨 Hotel ${hotel.name}:`, {
              distance: distance.toFixed(2),
              withinThreshold: distance <= maxDistanceKm
            });
            
            return {
              ...hotel,
              distance: parseFloat(distance.toFixed(2)),
              distanceKm: parseFloat(distance.toFixed(2))
            };
          }
          return null;
        })
        .filter(h => h && h.distance <= maxDistanceKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);

      console.log(`✅ Found ${hotels.length} hotels within ${maxDistanceKm}km`);
    }
    // Name-based fallback search
    else if (locationName) {
      console.log('🏷️ Searching hotels by location name:', locationName);
      
      hotels = await hotelRepo.findAll({
        approvalStatus: 'approved',
        $or: [
          { 'address.city': { $regex: locationName, $options: 'i' } },
          { 'address.street': { $regex: locationName, $options: 'i' } }
        ]
      }, {
        populate: ['locationId', 'guideId']
      });
    }

    res.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Error finding nearby hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find hotels',
      error: error.message
    });
  }
};

/**
 * Track hotel view for analytics
 */
export const trackHotelView = async (req, res) => {
  try {
    // Increment view count logic can be added here
    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
