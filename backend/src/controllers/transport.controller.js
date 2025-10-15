import { TransportRepository } from '../patterns/Repository.js';

const transportRepo = new TransportRepository();

/**
 * Create new transport (Guide only)
 */
export const createTransport = async (req, res) => {
  try {
    const transportData = {
      ...req.body,
      guideId: req.user._id,
      approvalStatus: 'pending',
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      transportData.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        caption: file.originalname,
      }));
    }

    const transport = await transportRepo.create(transportData);

    res.status(201).json({
      success: true,
      message: 'Transport created successfully. Waiting for admin approval.',
      data: transport,
    });
  } catch (error) {
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
    const { page = 1, limit = 10, locationId, type } = req.query;

    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (type) filter.type = type;

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

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        caption: file.originalname,
      }));
      updateData.images = [...(transport.images || []), ...newImages];
    }

    // Reset approval status if content changed
    if (req.user.role === 'guide') {
      updateData.approvalStatus = 'pending';
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
