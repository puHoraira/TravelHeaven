import {
  LocationRepository,
  HotelRepository,
  TransportRepository,
} from '../patterns/Repository.js';
import { getApprovalSubject } from '../patterns/Observer.js';

const locationRepo = new LocationRepository();
const hotelRepo = new HotelRepository();
const transportRepo = new TransportRepository();
const approvalSubject = getApprovalSubject();

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

    const item = await repository.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    if (item.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: `${type} is already approved`,
      });
    }

    const updatedItem = await repository.update(id, {
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Notify observers (Observer Pattern)
    approvalSubject.approvalStatusChanged(type, updatedItem, 'approved', req.user._id);

    res.json({
      success: true,
      message: `${type} approved successfully`,
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve submission',
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

    const item = await repository.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    const updatedItem = await repository.update(id, {
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Notify observers (Observer Pattern)
    approvalSubject.approvalStatusChanged(type, updatedItem, 'rejected', req.user._id);

    res.json({
      success: true,
      message: `${type} rejected`,
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject submission',
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
    ]);

    res.json({
      success: true,
      data: {
        total: {
          locations: totalLocations,
          hotels: totalHotels,
          transport: totalTransport,
        },
        pending: {
          locations: pendingLocations,
          hotels: pendingHotels,
          transport: pendingTransport,
          total: pendingLocations + pendingHotels + pendingTransport,
        },
        approved: {
          locations: approvedLocations,
          hotels: approvedHotels,
          transport: approvedTransport,
          total: approvedLocations + approvedHotels + approvedTransport,
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
