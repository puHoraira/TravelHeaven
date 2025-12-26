/**
 * Recommendation Controller
 * Handles HTTP requests for itinerary recommendations
 * Uses Facade pattern to simplify interaction with recommendation subsystem
 */

import { recommendationFacade } from '../patterns/recommendation/RecommendationFacade.js';

/**
 * Generate personalized itinerary recommendation
 * POST /api/recommendations/generate
 */
export const generateRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Validate required fields
    if (!preferences.budget || !preferences.duration) {
      return res.status(400).json({
        success: false,
        message: 'Budget and duration are required',
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
    const userId = req.user.id;
    const { budget, duration, interests } = req.body;

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
    const userId = req.user.id;
    const preferences = req.body;

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
    const userId = req.user.id;
    const { strategyType } = req.params;
    const preferences = req.body;

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
    const itinerary = req.body;

    // Ensure itinerary belongs to authenticated user
    if (itinerary.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to save this itinerary',
      });
    }

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

    // Check authorization
    if (itinerary.userId !== req.user.id && !req.user.isAdmin) {
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

    if (itinerary.userId !== req.user.id) {
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

    if (itinerary.userId !== req.user.id) {
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
