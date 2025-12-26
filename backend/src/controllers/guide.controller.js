import path from 'path';
import {
  UserRepository,
  LocationRepository,
  HotelRepository,
  TransportRepository,
} from '../patterns/Repository.js';

const userRepo = new UserRepository();
const locationRepo = new LocationRepository();
const hotelRepo = new HotelRepository();
const transportRepo = new TransportRepository();

const buildGuideSearchFilter = (search) => {
  if (!search) return null;
  return [
    { username: { $regex: search, $options: 'i' } },
    { 'profile.firstName': { $regex: search, $options: 'i' } },
    { 'profile.lastName': { $regex: search, $options: 'i' } },
    { 'profile.bio': { $regex: search, $options: 'i' } },
    { 'profile.specialties': { $regex: search, $options: 'i' } },
    { 'profile.location': { $regex: search, $options: 'i' } },
  ];
};

const sanitizeGuideForPublic = (guide) => {
  const doc = guide.toObject ? guide.toObject() : guide;
  if (doc.guideInfo) {
    const cleanGuideInfo = { ...doc.guideInfo };
    if (cleanGuideInfo.verificationDocument) {
      delete cleanGuideInfo.verificationDocument;
    }
    delete cleanGuideInfo.rejectionReason;
    doc.guideInfo = cleanGuideInfo;
  }
  return doc;
};

const PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'avatar',
  'bio',
  'location',
  'languages',
  'specialties',
];

const GUIDE_FIELDS = ['experience', 'availability'];
const PRICE_RANGE_FIELDS = ['min', 'max', 'currency'];
const CONTACT_FIELDS = ['phone', 'whatsapp', 'email'];

const ensureGuideContext = (req, res) => {
  if (req.user.role !== 'guide') {
    res.status(403).json({
      success: false,
      message: 'Only guides can perform this action',
    });
    return false;
  }
  return true;
};

const applyGuidePatch = (guide, payload, options) => {
  const {
    allowProfile = false,
    allowGuide = false,
    allowPriceRange = false,
    allowContact = false,
  } = options;

  const { profile, guideInfo } = payload || {};
  let hasChanges = false;

  if (allowProfile && profile && typeof profile === 'object') {
    guide.profile = guide.profile || {};
    PROFILE_FIELDS.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(profile, field)) {
        guide.profile[field] = profile[field];
        hasChanges = true;
      }
    });
  }

  if ((allowGuide || allowPriceRange || allowContact) && guideInfo && typeof guideInfo === 'object') {
    guide.guideInfo = guide.guideInfo || {};

    if (allowGuide) {
      GUIDE_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(guideInfo, field)) {
          guide.guideInfo[field] = guideInfo[field];
          hasChanges = true;
        }
      });
    }

    if (allowPriceRange && Object.prototype.hasOwnProperty.call(guideInfo, 'priceRange')) {
      const incomingPriceRange = guideInfo.priceRange;
      if (incomingPriceRange && typeof incomingPriceRange === 'object') {
        const nextPriceRange = { ...(guide.guideInfo.priceRange || {}) };
        PRICE_RANGE_FIELDS.forEach(field => {
          if (Object.prototype.hasOwnProperty.call(incomingPriceRange, field)) {
            nextPriceRange[field] = incomingPriceRange[field];
            hasChanges = true;
          }
        });
        guide.guideInfo.priceRange = nextPriceRange;
      }
    }

    if (allowContact && Object.prototype.hasOwnProperty.call(guideInfo, 'contactMethods')) {
      const incomingContact = guideInfo.contactMethods;
      if (incomingContact && typeof incomingContact === 'object') {
        const nextContact = { ...(guide.guideInfo.contactMethods || {}) };
        CONTACT_FIELDS.forEach(field => {
          if (Object.prototype.hasOwnProperty.call(incomingContact, field)) {
            nextContact[field] = incomingContact[field];
            hasChanges = true;
          }
        });
        guide.guideInfo.contactMethods = nextContact;
      }
    }
  }

  return hasChanges;
};

const handleGuideUpdate = async (req, res, options) => {
  if (!ensureGuideContext(req, res)) return;

  const guide = await userRepo.findById(req.user._id);

  if (!guide) {
    return res.status(404).json({
      success: false,
      message: 'Guide not found',
    });
  }

  const hasChanges = applyGuidePatch(guide, req.body, options);

  if (!hasChanges) {
    return res.status(400).json({
      success: false,
      message: 'No valid profile fields provided',
    });
  }

  await guide.save();

  res.json({
    success: true,
    message: 'Guide profile updated successfully',
    data: guide,
  });
};

/**
 * Get all guides
 */
export const getAllGuides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'rating'; // rating, name, newest

    let sort = { 'guideInfo.rating.average': -1 };
    if (sortBy === 'name') sort = { username: 1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };

    const filter = {
      role: 'guide',
      isActive: true,
      'guideInfo.verificationStatus': 'approved',
    };

    const searchCriteria = buildGuideSearchFilter(search);
    if (searchCriteria) {
      filter.$or = searchCriteria;
    }

    const result = await userRepo.findAll(filter, {
      page,
      limit,
      sort,
    });

    res.json({
      success: true,
      data: result.data.map(sanitizeGuideForPublic),
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guides',
      error: error.message,
    });
  }
};

/**
 * Get guide by ID
 */
export const getGuideById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const guide = await userRepo.findById(id);

    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    const isApproved = guide.guideInfo?.verificationStatus === 'approved';
    const isSelf = req.user && req.user._id.toString() === guide._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isApproved && !isSelf && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    res.json({
      success: true,
      data: guide,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guide',
      error: error.message,
    });
  }
};

/**
 * Update guide profile (legacy endpoint - retains broad payload for backward compatibility)
 */
export const updateGuideProfile = async (req, res) => {
  try {
    await handleGuideUpdate(req, res, {
      allowProfile: true,
      allowGuide: true,
      allowPriceRange: true,
      allowContact: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update guide profile',
      error: error.message,
    });
  }
};

export const updateGuideGeneralProfile = async (req, res) => {
  try {
    await handleGuideUpdate(req, res, {
      allowProfile: true,
      allowGuide: true,
      allowPriceRange: false,
      allowContact: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update guide profile',
      error: error.message,
    });
  }
};

export const updateGuidePricing = async (req, res) => {
  try {
    await handleGuideUpdate(req, res, {
      allowProfile: false,
      allowGuide: false,
      allowPriceRange: true,
      allowContact: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing information',
      error: error.message,
    });
  }
};

export const updateGuideContactMethods = async (req, res) => {
  try {
    await handleGuideUpdate(req, res, {
      allowProfile: false,
      allowGuide: false,
      allowPriceRange: false,
      allowContact: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update contact information',
      error: error.message,
    });
  }
};

export const resubmitGuideVerification = async (req, res) => {
  try {
    if (!ensureGuideContext(req, res)) return;

    if (!req.savedFile) {
      return res.status(400).json({
        success: false,
        message: 'Verification document is required',
      });
    }

    const guide = await userRepo.findById(req.user._id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found',
      });
    }

    // Delete old verification document if exists
    if (guide.guideInfo?.verificationDocument) {
      // TODO: Delete old file from MongoDB if needed
      const File = (await import('../models/File.js')).default;
      await File.findByIdAndDelete(guide.guideInfo.verificationDocument);
    }

    guide.guideInfo = guide.guideInfo || {};
    guide.guideInfo.verificationDocument = req.savedFile._id; // Store reference to File document
    guide.guideInfo.verificationStatus = 'pending';
    guide.guideInfo.rejectionReason = undefined;
    guide.guideInfo.verificationResubmittedAt = new Date();

    await guide.save();

    res.json({
      success: true,
      message: 'Verification document resubmitted. Awaiting admin review.',
      data: {
        verificationStatus: guide.guideInfo.verificationStatus,
        verificationDocument: {
          id: req.savedFile._id,
          url: req.savedFile.url,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit verification',
      error: error.message,
    });
  }
};

export const getGuideMetrics = async (req, res) => {
  try {
    if (!ensureGuideContext(req, res)) return;

    const guideId = req.user._id;

    const [
      pendingLocations,
      approvedLocations,
      rejectedLocations,
      pendingHotels,
      approvedHotels,
      rejectedHotels,
      pendingTransport,
      approvedTransport,
      rejectedTransport,
    ] = await Promise.all([
      locationRepo.count({ guideId, approvalStatus: 'pending' }),
      locationRepo.count({ guideId, approvalStatus: 'approved' }),
      locationRepo.count({ guideId, approvalStatus: 'rejected' }),
      hotelRepo.count({ guideId, approvalStatus: 'pending' }),
      hotelRepo.count({ guideId, approvalStatus: 'approved' }),
      hotelRepo.count({ guideId, approvalStatus: 'rejected' }),
      transportRepo.count({ guideId, approvalStatus: 'pending' }),
      transportRepo.count({ guideId, approvalStatus: 'approved' }),
      transportRepo.count({ guideId, approvalStatus: 'rejected' }),
    ]);

    res.json({
      success: true,
      data: {
        submissions: {
          pending: pendingLocations + pendingHotels + pendingTransport,
          approved: approvedLocations + approvedHotels + approvedTransport,
          rejected: rejectedLocations + rejectedHotels + rejectedTransport,
        },
        breakdown: {
          locations: {
            pending: pendingLocations,
            approved: approvedLocations,
            rejected: rejectedLocations,
          },
          hotels: {
            pending: pendingHotels,
            approved: approvedHotels,
            rejected: rejectedHotels,
          },
          transport: {
            pending: pendingTransport,
            approved: approvedTransport,
            rejected: rejectedTransport,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load guide metrics',
      error: error.message,
    });
  }
};

export const getGuidesForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const sortBy = req.query.sortBy || 'recent';

    let sort = { createdAt: -1 };
    if (sortBy === 'name') sort = { username: 1 };
    if (sortBy === 'rating') sort = { 'guideInfo.rating.average': -1 };

    const filter = {
      role: 'guide',
    };

    if (status !== 'all') {
      filter['guideInfo.verificationStatus'] = status;
    }

    const searchCriteria = buildGuideSearchFilter(search);
    if (searchCriteria) {
      filter.$or = searchCriteria;
    }

    const result = await userRepo.findAll(filter, {
      page,
      limit,
      sort,
    });

    const guides = result.data.map((guide) => {
      const doc = guide.toObject ? guide.toObject() : guide;
      if (doc.guideInfo?.verificationDocument) {
        const document = { ...doc.guideInfo.verificationDocument };
        delete document.diskPath;
        doc.guideInfo.verificationDocument = document;
      }
      return doc;
    });

    res.json({
      success: true,
      data: guides,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guides',
      error: error.message,
    });
  }
};
