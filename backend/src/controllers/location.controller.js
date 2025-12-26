import { LocationRepository } from '../patterns/Repository.js';
import { ensureGuideApproved } from '../utils/guide.js';

const locationRepo = new LocationRepository();

/**
 * Create new location (Guide only)
 */
export const createLocation = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    console.log('[createLocation] Request body:', {
      name: req.body.name,
      description: req.body.description?.substring(0, 50),
      country: req.body.country,
      city: req.body.city,
      category: req.body.category,
      filesCount: req.files?.length || 0,
    });

    // Strict validation
    const errors = [];
    
    if (!req.body.name || req.body.name.trim().length < 3) {
      errors.push('Name must be at least 3 characters');
    }
    
    if (!req.body.description || req.body.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    
    if (!req.body.country || req.body.country.trim().length < 2) {
      errors.push('Country is required');
    }
    
    if (!req.body.city || req.body.city.trim().length < 2) {
      errors.push('City is required');
    }
    
    if (!req.body.category || !['historical', 'natural', 'adventure', 'cultural', 'beach', 'mountain', 'other'].includes(req.body.category)) {
      errors.push('Valid category is required (historical, natural, adventure, cultural, beach, mountain, other)');
    }
    
    // Validate coordinates if provided
    if ((req.body.latitude || req.body.longitude)) {
      const lat = parseFloat(req.body.latitude);
      const lon = parseFloat(req.body.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }
    
    // Validate entry fee if provided
    if (req.body.entryFeeAmount) {
      const fee = parseFloat(req.body.entryFeeAmount);
      if (isNaN(fee) || fee < 0) {
        errors.push('Entry fee must be a positive number');
      }
    }
    
    if (errors.length > 0) {
      console.log('[createLocation] Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    const locationData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      country: req.body.country.trim(),
      city: req.body.city.trim(),
      category: req.body.category,
      guideId: req.user._id,
      approvalStatus: 'pending',
      rejectionReason: null,
      resubmittedAt: null,
    };

    // Optional fields
    if (req.body.address) locationData.address = req.body.address.trim();
    if (req.body.bestTimeToVisit) locationData.bestTimeToVisit = req.body.bestTimeToVisit.trim();
    if (req.body.openingHours) locationData.openingHours = req.body.openingHours.trim();
    
    // Coordinates
    if (req.body.latitude && req.body.longitude) {
      locationData.coordinates = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      };
    }

    // Entry fee
    if (req.body.entryFeeAmount) {
      locationData.entryFee = {
        amount: parseFloat(req.body.entryFeeAmount),
        currency: req.body.entryFeeCurrency || 'BDT',
        details: req.body.entryFeeDetails || '',
      };
    } else {
      // Default to free entry
      locationData.entryFee = {
        amount: 0,
        currency: 'BDT',
        details: 'Free entry',
      };
    }

    // Arrays - parse JSON if sent as strings
    if (req.body.attractions) {
      try {
        locationData.attractions = typeof req.body.attractions === 'string' 
          ? JSON.parse(req.body.attractions) 
          : req.body.attractions;
      } catch (e) {
        locationData.attractions = [];
      }
    }

    if (req.body.activities) {
      try {
        locationData.activities = typeof req.body.activities === 'string' 
          ? JSON.parse(req.body.activities) 
          : req.body.activities;
      } catch (e) {
        locationData.activities = [];
      }
    }

    // Handle uploaded images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      locationData.images = req.files.map(file => ({
        file: file.mongoId, // Reference to File document in MongoDB
        caption: file.originalname,
      }));
    }

    const location = await locationRepo.create(locationData);

    res.status(201).json({
      success: true,
      message: 'Location created successfully. Waiting for admin approval.',
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message,
    });
  }
};

/**
 * Get all approved locations
 */
export const getLocations = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, country, city } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (country) filter.country = country;
    if (city) filter.city = city;

    const result = await locationRepo.findApproved(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['guideId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get locations',
      error: error.message,
    });
  }
};

/**
 * Get location by ID
 */
export const getLocationById = async (req, res) => {
  try {
    const location = await locationRepo.findById(req.params.id, ['guideId']);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Populate file references in images
    if (location.images && location.images.length > 0) {
      await location.populate('images.file');
    }

    // Only show approved locations to non-admin users / public
    const role = req.user?.role || 'public';
    if (role !== 'admin' && location.approvalStatus !== 'approved') {
      if (role === 'guide' && location.guideId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      // Public users (not logged in) cannot view pending items
      if (role === 'public') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message,
    });
  }
};

/**
 * Update location (Guide only - own locations)
 */
export const updateLocation = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const location = await locationRepo.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && location.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own locations',
      });
    }

    const updateData = { ...req.body };

    // Handle uploaded images - store as MongoDB File references
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        file: file.mongoId, // Reference to File document in MongoDB
        caption: file.originalname,
      }));
      updateData.images = [...(location.images || []), ...newImages];
    }

    // Reset approval status if content changed
    if (req.user.role === 'guide') {
      updateData.approvalStatus = 'pending';
      updateData.rejectionReason = null;
      updateData.resubmittedAt = new Date();
    }

    const updatedLocation = await locationRepo.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message,
    });
  }
};

/**
 * Delete location
 */
export const deleteLocation = async (req, res) => {
  try {
    if (!ensureGuideApproved(req, res)) return;

    const location = await locationRepo.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Check ownership
    if (req.user.role === 'guide' && location.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own locations',
      });
    }

    await locationRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message,
    });
  }
};

/**
 * Get guide's own locations
 */
export const getMyLocations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await locationRepo.findByGuide(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get locations',
      error: error.message,
    });
  }
};
