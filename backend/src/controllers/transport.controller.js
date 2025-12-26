import { TransportRepository } from '../patterns/Repository.js';
import { ensureGuideApproved } from '../utils/guide.js';
import * as transportService from '../services/transport.service.js';

const transportRepo = new TransportRepository();

/**
 * Create new transport (Guide only)
 */
export const createTransport = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const transportData = { ...req.body };
    
    // Parse JSON strings from FormData
    ['route', 'operator', 'pricing', 'schedule', 'booking', 'facilities', 'contactInfo'].forEach(field => {
      if (transportData[field] && typeof transportData[field] === 'string') {
        try {
          transportData[field] = JSON.parse(transportData[field]);
        } catch (e) {
          console.error(`Failed to parse ${field}:`, e);
        }
      }
    });

    // Strict validation
    const errors = [];
    
    if (!transportData.name || transportData.name.trim().length < 3) {
      errors.push('Transport name must be at least 3 characters');
    }
    
    if (!transportData.type || !['bus', 'train', 'taxi', 'rental-car', 'flight', 'boat', 'launch', 'cng', 'rickshaw', 'other'].includes(transportData.type)) {
      errors.push('Valid transport type is required (bus, train, taxi, rental-car, flight, boat, launch, cng, rickshaw, other)');
    }
    
    // Validate route
    if (!transportData.route || !transportData.route.from || !transportData.route.to) {
      errors.push('Route with from and to locations is required');
    } else {
      // Validate from location
      if (!transportData.route.from.name || transportData.route.from.name.trim().length < 2) {
        errors.push('Route from location name is required');
      }
      if (transportData.route.from.location && transportData.route.from.location.coordinates) {
        const [lon, lat] = transportData.route.from.location.coordinates;
        if (isNaN(lon) || lon < -180 || lon > 180 || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push('Invalid from location coordinates');
        }
      }
      
      // Validate to location
      if (!transportData.route.to.name || transportData.route.to.name.trim().length < 2) {
        errors.push('Route to location name is required');
      }
      if (transportData.route.to.location && transportData.route.to.location.coordinates) {
        const [lon, lat] = transportData.route.to.location.coordinates;
        if (isNaN(lon) || lon < -180 || lon > 180 || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push('Invalid to location coordinates');
        }
      }
    }
    
    // Validate pricing
    if (!transportData.pricing || typeof transportData.pricing.amount !== 'number' || transportData.pricing.amount < 0) {
      errors.push('Valid pricing amount is required (must be >= 0)');
    }
    
    // Validate facilities
    if (transportData.facilities && !Array.isArray(transportData.facilities)) {
      errors.push('Facilities must be an array');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Build clean transport data
    const cleanData = {
      name: transportData.name.trim(),
      type: transportData.type,
      description: transportData.description ? transportData.description.trim() : '',
      route: transportData.route,
      pricing: {
        amount: parseFloat(transportData.pricing.amount),
        currency: transportData.pricing.currency || 'BDT',
        priceType: transportData.pricing.priceType || 'per-person',
        priceNote: transportData.pricing.priceNote || ''
      },
      facilities: transportData.facilities || [],
      guideId: req.user._id,
      approvalStatus: 'pending',
      rejectionReason: null,
      resubmittedAt: null,
    };

    // Optional fields
    if (transportData.operator) cleanData.operator = transportData.operator;
    if (transportData.schedule) cleanData.schedule = transportData.schedule;
    if (transportData.booking) cleanData.booking = transportData.booking;
    if (transportData.contactInfo) cleanData.contactInfo = transportData.contactInfo;
    if (transportData.capacity) cleanData.capacity = transportData.capacity;
    if (transportData.accessibility) cleanData.accessibility = transportData.accessibility;
    if (transportData.safetyFeatures) cleanData.safetyFeatures = transportData.safetyFeatures;
    if (transportData.locationId) cleanData.locationId = transportData.locationId;

    // Handle uploaded images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      cleanData.images = req.files.map(file => ({
        file: file.mongoId, // Reference to File document in MongoDB
        caption: file.originalname,
      }));
    }

    const transport = await transportRepo.create(cleanData);

    res.status(201).json({
      success: true,
      message: 'Transport created successfully. Waiting for admin approval.',
      data: transport,
    });
  } catch (error) {
    console.error('Create transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transport',
      error: error.message,
    });
  }
};

/**
 * Get all approved transportation
 */
export const getTransportation = async (req, res) => {
  try {
    const { page = 1, limit = 10, locationId, type, guideId } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (type) filter.type = type;
    if (guideId) filter.guideId = guideId;

    const result = await transportRepo.findApproved(filter, {
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
      message: 'Failed to get transportation',
      error: error.message,
    });
  }
};

/**
 * Get transport by ID
 */
export const getTransportById = async (req, res) => {
  try {
    const transport = await transportRepo.findById(req.params.id, ['locationId', 'guideId']);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    // Populate file references in images
    if (transport.images && transport.images.length > 0) {
      await transport.populate('images.file');
    }

    // Only show approved transport to non-admin users / public
    const role = req.user?.role || 'public';
    if (role !== 'admin' && transport.approvalStatus !== 'approved') {
      if (role === 'guide' && transport.guideId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (role === 'public') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({
      success: true,
      data: transport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get transport',
      error: error.message,
    });
  }
};

/**
 * Update transport (Guide only - own transport)
 */
export const updateTransport = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const transport = await transportRepo.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && transport.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own transport',
      });
    }

    const updateData = { ...req.body };

    // Handle uploaded images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        file: file.mongoId, // Reference to File document in MongoDB
        caption: file.originalname,
      }));
      updateData.images = [...(transport.images || []), ...newImages];
    }

    // Reset approval status if content changed
    if (req.user.role === 'guide') {
      updateData.approvalStatus = 'pending';
      updateData.rejectionReason = null;
      updateData.resubmittedAt = new Date();
    }

    const updatedTransport = await transportRepo.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Transport updated successfully',
      data: updatedTransport,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update transport',
      error: error.message,
    });
  }
};

/**
 * Delete transport
 */
export const deleteTransport = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const transport = await transportRepo.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && transport.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own transport',
      });
    }

    await transportRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Transport deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete transport',
      error: error.message,
    });
  }
};

/**
 * Get guide's own transport
 */
export const getMyTransport = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await transportRepo.findByGuide(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['locationId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get transport',
      error: error.message,
    });
  }
};

/**
 * Find routes between two locations (for itinerary planning)
 */
export const findRoutes = async (req, res) => {
  try {
    console.log('🗺️ findRoutes called with query:', req.query);
    
    const { fromLat, fromLng, toLat, toLng, fromName, toName, type, maxDistance } = req.query;

    let result;

    if (fromLat && fromLng && toLat && toLng) {
      console.log('📍 Using GPS-based search:', {
        from: `(${fromLat}, ${fromLng})`,
        to: `(${toLat}, ${toLng})`,
        type,
        maxDistance
      });

      const options = {
        transportType: type,
        maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
      };

      result = await transportService.findAllTransportOptions(
        parseFloat(fromLat),
        parseFloat(fromLng),
        parseFloat(toLat),
        parseFloat(toLng),
        options
      );

      console.log('📊 GPS search result:', {
        directRoutes: result.directRoutes?.length || 0,
        nearbyRoutes: result.nearbyRoutes?.length || 0,
        totalOptions: result.totalOptions || 0
      });

      res.json({
        success: true,
        data: result,
        searchType: 'coordinates',
      });
    } else if (fromName && toName) {
      console.log('🏷️ Using name-based search:', { fromName, toName, type });

      const options = {
        transportType: type,
        limit: 20,
      };

      const transports = await transportService.findTransportByLocationNames(
        fromName,
        toName,
        options
      );

      res.json({
        success: true,
        data: transports,
        searchType: 'location-names',
        count: transports.length,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either coordinates (fromLat, fromLng, toLat, toLng) or location names (fromName, toName)',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find routes',
      error: error.message,
    });
  }
};

/**
 * Get popular routes
 */
export const getPopularRoutes = async (req, res) => {
  try {
    const { limit = 10, type } = req.query;

    const routes = await transportService.getPopularRoutes({
      limit: parseInt(limit),
      type,
    });

    res.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get popular routes',
      error: error.message,
    });
  }
};

/**
 * Search by operator
 */
export const searchByOperator = async (req, res) => {
  try {
    const { operator, type, limit = 20 } = req.query;

    if (!operator) {
      return res.status(400).json({
        success: false,
        message: 'Operator name is required',
      });
    }

    const transports = await transportService.searchByOperator(operator, {
      type,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: transports,
      count: transports.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search by operator',
      error: error.message,
    });
  }
};

/**
 * Increment view count
 */
export const incrementViewCount = async (req, res) => {
  try {
    const transport = await transportRepo.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    await transport.incrementView();

    res.json({
      success: true,
      message: 'View count updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update view count',
      error: error.message,
    });
  }
};

/**
 * Record booking
 */
export const recordBooking = async (req, res) => {
  try {
    const transport = await transportRepo.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    transport.bookingCount += 1;
    await transport.save();

    res.json({
      success: true,
      message: 'Booking recorded',
      data: {
        bookingInfo: transport.booking,
        contactInfo: transport.contactInfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record booking',
      error: error.message,
    });
  }
};
