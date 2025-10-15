import { HotelRepository } from '../patterns/Repository.js';

const hotelRepo = new HotelRepository();

/**
 * Create new hotel (Guide only)
 */
export const createHotel = async (req, res) => {
  try {
    const hotelData = {
      ...req.body,
      guideId: req.user._id,
      approvalStatus: 'pending',
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      hotelData.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
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
    const { page = 1, limit = 10, locationId, minRating } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

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

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        caption: file.originalname,
      }));
      updateData.images = [...(hotel.images || []), ...newImages];
    }

    // Reset approval status if content changed
    if (req.user.role === 'guide') {
      updateData.approvalStatus = 'pending';
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

    const result = await hotelRepo.findByGuide(req.user._id, {
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
      message: 'Failed to get hotels',
      error: error.message,
    });
  }
};
