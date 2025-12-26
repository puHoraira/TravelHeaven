/**
 * Recommendation Controller
 * Handles HTTP requests for itinerary recommendations
 * Uses Facade pattern to simplify interaction with recommendation subsystem
 */

import { recommendationFacade } from '../patterns/recommendation/RecommendationFacade.js';

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeRecommendationPreferences = (raw) => {
  const preferences = raw && typeof raw === 'object' ? { ...raw } : {};

  const budget = toNumberOrNull(preferences.budget);
  const duration = toNumberOrNull(preferences.duration);

  // Normalize interests/enhancements
  if (!Array.isArray(preferences.interests)) preferences.interests = [];
  if (!Array.isArray(preferences.enhancements)) preferences.enhancements = [];

  // Normalize minRating
  const minRating = toNumberOrNull(preferences.minRating);
  if (minRating !== null) preferences.minRating = minRating;

  // Normalize dates. If missing, derive from duration.
  const now = new Date();
  const startDate = preferences.startDate ? new Date(preferences.startDate) : now;
  const hasValidStart = startDate instanceof Date && !Number.isNaN(startDate.getTime());
  const safeStart = hasValidStart ? startDate : now;

  let endDate;
  if (preferences.endDate) {
    endDate = new Date(preferences.endDate);
  } else if (duration !== null) {
    endDate = new Date(safeStart);
    endDate.setDate(endDate.getDate() + Math.max(1, duration) - 1);
  } else {
    endDate = null;
  }

  const hasValidEnd = endDate instanceof Date && endDate && !Number.isNaN(endDate.getTime());

  if (budget !== null) preferences.budget = budget;
  if (duration !== null) preferences.duration = duration;
  preferences.startDate = safeStart.toISOString();
  if (hasValidEnd) preferences.endDate = endDate.toISOString();

  // Ensure endDate is not before startDate
  if (preferences.endDate) {
    const s = new Date(preferences.startDate);
    const e = new Date(preferences.endDate);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e < s) {
      preferences.endDate = s.toISOString();
    }
  }

  return preferences;
};

/**
 * Generate personalized itinerary recommendation
 * POST /api/recommendations/generate
 */
export const generateRecommendation = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const preferences = normalizeRecommendationPreferences(req.body);

    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (preferences.budget == null || preferences.duration == null) {
      return res.status(400).json({
        success: false,
        message: 'Budget and duration are required',
      });
    }

    if (typeof preferences.budget !== 'number' || preferences.budget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number',
      });
    }

    if (typeof preferences.duration !== 'number' || preferences.duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number of days',
      });
    }

    if (!preferences.startDate || !preferences.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required (or derivable from duration)',
      });
    }

    const startDate = new Date(preferences.startDate);
    const endDate = new Date(preferences.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate/endDate',
      });
    }

    // Generate recommendation using facade
    const result = await recommendationFacade.generateRecommendation(userId, preferences);

    if (!result.success) {
      const code = result.code;
      const message = result.error || 'Failed to generate recommendation';

      if (code === 'NO_LOCATIONS') {
        return res.status(404).json({ success: false, message, code });
      }

      if (code === 'NO_MATCHING_LOCATIONS' || code === 'NO_DESTINATIONS') {
        return res.status(422).json({ success: false, message, code });
      }

      return res.status(500).json({ success: false, message, code });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in generateRecommendation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Get quick recommendation with minimal input
 * POST /api/recommendations/quick
 */
export const getQuickRecommendation = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { budget, duration, interests } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await recommendationFacade.getQuickRecommendation(userId, {
      budget: budget || 1000,
      duration: duration || 3,
      interests: interests || ['cultural'],
    });

    if (!result.success) {
      const code = result.code;
      const message = result.error || 'Failed to generate recommendation';
      if (code === 'NO_LOCATIONS') {
        return res.status(404).json({ success: false, message, code });
      }
      if (code === 'NO_MATCHING_LOCATIONS' || code === 'NO_DESTINATIONS') {
        return res.status(422).json({ success: false, message, code });
      }
      return res.status(500).json({ success: false, message, code });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getQuickRecommendation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Compare different recommendation strategies
 * POST /api/recommendations/compare
 */
export const compareStrategies = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const preferences = normalizeRecommendationPreferences(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const comparison = await recommendationFacade.compareStrategies(userId, preferences);

    return res.status(200).json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Error in compareStrategies:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Generate recommendation with specific strategy
 * POST /api/recommendations/strategy/:strategyType
 */
export const getRecommendationByStrategy = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { strategyType } = req.params;
    const preferences = normalizeRecommendationPreferences(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const validStrategies = ['budget', 'activity', 'comfort', 'time'];
    if (!validStrategies.includes(strategyType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`,
      });
    }

    const result = await recommendationFacade.getRecommendationWithStrategy(
      userId,
      preferences,
      strategyType
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getRecommendationByStrategy:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Save generated itinerary
 * POST /api/recommendations/save
 */
export const saveItinerary = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Never trust client-supplied userId. Force ownership to current user.
    const itinerary = {
      ...(req.body && typeof req.body === 'object' ? req.body : {}),
      userId,
    };

    const savedItinerary = await recommendationFacade.saveItinerary(itinerary);

    return res.status(201).json({
      success: true,
      message: 'Itinerary saved successfully',
      itinerary: savedItinerary,
    });
  } catch (error) {
    console.error('Error in saveItinerary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Get saved itinerary by ID
 * GET /api/recommendations/itinerary/:id
 */
export const getItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await recommendationFacade.getItinerary(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    // Check authorization
    const isAdmin = req.user?.role === 'admin';
    const ownerId = itinerary.ownerId?._id?.toString?.() || itinerary.ownerId?.toString?.();
    const currentUserId = req.user?._id?.toString?.();
    if (!isAdmin && ownerId && currentUserId && ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this itinerary',
      });
    }

    return res.status(200).json({
      success: true,
      itinerary,
    });
  } catch (error) {
    console.error('Error in getItinerary:', error);
    return res.status(404).json({
      success: false,
      message: 'Itinerary not found',
    });
  }
};

/**
 * Update saved itinerary
 * PUT /api/recommendations/itinerary/:id
 */
export const updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // First, get the itinerary to check ownership
    const itinerary = await recommendationFacade.getItinerary(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    const ownerId = itinerary.ownerId?._id?.toString?.() || itinerary.ownerId?.toString?.();
    const currentUserId = req.user?._id?.toString?.();
    if (!ownerId || !currentUserId || ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this itinerary',
      });
    }

    const updatedItinerary = await recommendationFacade.updateItinerary(id, updates);

    return res.status(200).json({
      success: true,
      message: 'Itinerary updated successfully',
      itinerary: updatedItinerary,
    });
  } catch (error) {
    console.error('Error in updateItinerary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Delete saved itinerary
 * DELETE /api/recommendations/itinerary/:id
 */
export const deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the itinerary to check ownership
    const itinerary = await recommendationFacade.getItinerary(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    const ownerId = itinerary.ownerId?._id?.toString?.() || itinerary.ownerId?.toString?.();
    const currentUserId = req.user?._id?.toString?.();
    if (!ownerId || !currentUserId || ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this itinerary',
      });
    }

    await recommendationFacade.deleteItinerary(id);

    return res.status(200).json({
      success: true,
      message: 'Itinerary deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteItinerary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
