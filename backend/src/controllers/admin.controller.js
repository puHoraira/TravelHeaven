import {
  LocationRepository,
  HotelRepository,
  TransportRepository,
  UserRepository,
} from '../patterns/Repository.js';
import { approvalService } from '../services/approval.service.js';

const normalizeVerificationDocument = (guide) => {
  if (!guide || !guide.guideInfo || !guide.guideInfo.verificationDocument) {
    return guide;
  }

  const guideCopy = typeof guide.toObject === 'function' ? guide.toObject() : { ...guide };
  const doc = guideCopy.guideInfo.verificationDocument;

  // If it's a populated File document (from MongoDB)
  if (doc._id) {
    // File document structure
    guideCopy.guideInfo.verificationDocument = {
      _id: doc._id,
      id: doc._id,
      filename: doc.filename,
      originalName: doc.originalName,
      mimetype: doc.mimetype,
      size: doc.size,
      uploadedAt: doc.createdAt || new Date(),
      url: `/api/files/${doc._id}`, // Generate file URL
    };
    return guideCopy;
  }

  // Fallback for old structure (shouldn't happen with new system)
  const rawPath = doc.url || doc.path || doc.diskPath;
  if (!rawPath) {
    guideCopy.guideInfo.verificationDocument = {
      ...doc,
    };
    return guideCopy;
  }

  if (/^https?:\/\//i.test(rawPath)) {
    guideCopy.guideInfo.verificationDocument = {
      ...doc,
      url: rawPath,
    };
    return guideCopy;
  }

  const cleaned = rawPath.replace(/\\/g, '/');
  const uploadsIndex = cleaned.lastIndexOf('uploads');
  const relative = uploadsIndex !== -1 ? cleaned.slice(uploadsIndex) : cleaned.replace(/^\/?/, '');
  const normalized = `/${relative.replace(/^\/?/, '')}`;

  guideCopy.guideInfo.verificationDocument = {
    ...doc,
    path: relative,
    url: normalized,
  };

  return guideCopy;
};

const locationRepo = new LocationRepository();
const hotelRepo = new HotelRepository();
const transportRepo = new TransportRepository();
const userRepo = new UserRepository();

/**
 * Get all pending approvals (Admin only)
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [locations, hotels, transportation] = await Promise.all([
      locationRepo.findPending({ page: parseInt(page), limit: parseInt(limit), populate: ['guideId'] }),
      hotelRepo.findPending({ page: parseInt(page), limit: parseInt(limit), populate: ['guideId', 'locationId'] }),
      transportRepo.findPending({ page: parseInt(page), limit: parseInt(limit), populate: ['guideId', 'locationId'] }),
    ]);

    res.json({
      success: true,
      data: {
        locations: locations.data,
        hotels: hotels.data,
        transportation: transportation.data,
      },
      counts: {
        locations: locations.pagination.total,
        hotels: hotels.pagination.total,
        transportation: transportation.pagination.total,
        total: locations.pagination.total + hotels.pagination.total + transportation.pagination.total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals',
      error: error.message,
    });
  }
};

/**
 * Approve submission (Admin only)
 */
export const approveSubmission = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { comments } = req.body;

    let repository;
    switch (type.toLowerCase()) {
      case 'location':
        repository = locationRepo;
        break;
      case 'hotel':
        repository = hotelRepo;
        break;
      case 'transport':
        repository = transportRepo;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be location, hotel, or transport',
        });
    }

  const updatedItem = await approvalService.approveItem(repository, type, id, req.user._id, comments);

    res.json({
      success: true,
      message: `${type} approved successfully`,
      data: updatedItem,
    });
  } catch (error) {
    const status = error.code || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to approve submission',
      error: error.message,
    });
  }
};

/**
 * Reject submission (Admin only)
 */
export const rejectSubmission = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    let repository;
    switch (type.toLowerCase()) {
      case 'location':
        repository = locationRepo;
        break;
      case 'hotel':
        repository = hotelRepo;
        break;
      case 'transport':
        repository = transportRepo;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be location, hotel, or transport',
        });
    }
  const updatedItem = await approvalService.rejectItem(repository, type, id, req.user._id, reason);

    res.json({
      success: true,
      message: `${type} rejected`,
      data: updatedItem,
    });
  } catch (error) {
    const status = error.code || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to reject submission',
      error: error.message,
    });
  }
};

/**
 * Get statistics (Admin only)
 */
export const getStatistics = async (req, res) => {
  try {
    const [
      totalLocations,
      totalHotels,
      totalTransport,
      pendingLocations,
      pendingHotels,
      pendingTransport,
      approvedLocations,
      approvedHotels,
      approvedTransport,
      rejectedLocations,
      rejectedHotels,
      rejectedTransport,
      totalGuides,
      pendingGuides
    ] = await Promise.all([
      locationRepo.count(),
      hotelRepo.count(),
      transportRepo.count(),
      locationRepo.count({ approvalStatus: 'pending' }),
      hotelRepo.count({ approvalStatus: 'pending' }),
      transportRepo.count({ approvalStatus: 'pending' }),
      locationRepo.count({ approvalStatus: 'approved' }),
      hotelRepo.count({ approvalStatus: 'approved' }),
      transportRepo.count({ approvalStatus: 'approved' }),
      locationRepo.count({ approvalStatus: 'rejected' }),
      hotelRepo.count({ approvalStatus: 'rejected' }),
      transportRepo.count({ approvalStatus: 'rejected' }),
      userRepo.count({ role: 'guide' }),
      userRepo.count({ role: 'guide', 'guideInfo.verificationStatus': 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        total: {
          locations: totalLocations,
          hotels: totalHotels,
          transport: totalTransport,
          guides: totalGuides,
        },
        pending: {
          locations: pendingLocations,
          hotels: pendingHotels,
          transport: pendingTransport,
          guides: pendingGuides,
          total: pendingLocations + pendingHotels + pendingTransport,
        },
        approved: {
          locations: approvedLocations,
          hotels: approvedHotels,
          transport: approvedTransport,
          total: approvedLocations + approvedHotels + approvedTransport,
        },
        rejected: {
          locations: rejectedLocations,
          hotels: rejectedHotels,
          transport: rejectedTransport,
          total: rejectedLocations + rejectedHotels + rejectedTransport,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message,
    });
  }
};

/**
 * Get all submissions (Admin only)
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;

    let repository;
    if (type) {
      switch (type.toLowerCase()) {
        case 'location':
          repository = locationRepo;
          break;
        case 'hotel':
          repository = hotelRepo;
          break;
        case 'transport':
          repository = transportRepo;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid type',
          });
      }

      const filter = status ? { approvalStatus: status } : {};
      const result = await repository.findAll(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: ['guideId', 'approvedBy'],
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }

    // Get all types
    const filter = status ? { approvalStatus: status } : {};
    const [locations, hotels, transportation] = await Promise.all([
      locationRepo.findAll(filter, { page: parseInt(page), limit: parseInt(limit), populate: ['guideId', 'approvedBy'] }),
      hotelRepo.findAll(filter, { page: parseInt(page), limit: parseInt(limit), populate: ['guideId', 'approvedBy'] }),
      transportRepo.findAll(filter, { page: parseInt(page), limit: parseInt(limit), populate: ['guideId', 'approvedBy'] }),
    ]);

    res.json({
      success: true,
      data: {
        locations: locations.data,
        hotels: hotels.data,
        transportation: transportation.data,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get submissions',
      error: error.message,
    });
  }
};

/**
 * Get all pending guide verifications
 */
export const getPendingGuides = async (req, res) => {
  try {
    const { User } = await import('../models/User.js');
    const pendingGuides = await User.find({ 
      role: 'guide', 
      'guideInfo.verificationStatus': 'pending' 
    })
      .populate('guideInfo.verificationDocument')
      .sort({ createdAt: -1 });
    
    const guides = pendingGuides.map(normalizeVerificationDocument);

    res.json({
      success: true,
      guides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending guides',
      error: error.message,
    });
  }
};

/**
 * Approve guide verification
 */
export const approveGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const { User } = await import('../models/User.js');

    const guide = await User.findById(guideId).populate('guideInfo.verificationDocument');
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    if (guide.role !== 'guide') {
      return res.status(400).json({
        success: false,
        message: 'User is not a guide',
      });
    }

    if (guide.guideInfo.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Guide verification is not pending',
      });
    }

    // Update guide verification status
    guide.guideInfo.verificationStatus = 'approved';
    guide.guideInfo.verifiedBy = req.user._id;
    guide.guideInfo.verifiedAt = new Date();
    
    await guide.save();

    res.json({
      success: true,
      message: 'Guide approved successfully',
      guide: {
        id: guide._id,
        username: guide.username,
        email: guide.email,
        verificationStatus: guide.guideInfo.verificationStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve guide',
      error: error.message,
    });
  }
};

/**
 * Reject guide verification
 */
export const rejectGuide = async (req, res) => {
  try {
    const { guideId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const guide = await userRepo.findById(guideId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    if (guide.role !== 'guide') {
      return res.status(400).json({
        success: false,
        message: 'User is not a guide',
      });
    }

    if (guide.guideInfo.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Guide verification is not pending',
      });
    }

    // Update guide verification status
    guide.guideInfo.verificationStatus = 'rejected';
    guide.guideInfo.rejectionReason = reason;
    guide.guideInfo.verifiedBy = req.user._id;
    guide.guideInfo.verifiedAt = new Date();
    
    await guide.save();

    res.json({
      success: true,
      message: 'Guide rejected successfully',
      guide: {
        id: guide._id,
        username: guide.username,
        email: guide.email,
        verificationStatus: guide.guideInfo.verificationStatus,
        rejectionReason: reason,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject guide',
      error: error.message,
    });
  }
};
