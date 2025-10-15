import { ItineraryRepository } from '../patterns/Repository.js';

const itineraryRepo = new ItineraryRepository();

/**
 * Create new itinerary
 */
export const createItinerary = async (req, res) => {
  try {
    const itineraryData = {
      ...req.body,
      ownerId: req.user._id,
      completeness: 0,
    };

    const itinerary = await itineraryRepo.create(itineraryData);
    await itineraryRepo.updateCompleteness(itinerary._id);

    res.status(201).json({
      success: true,
      message: 'Itinerary created successfully',
      data: itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary',
      error: error.message,
    });
  }
};

/**
 * Get user's itineraries
 */
export const getMyItineraries = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await itineraryRepo.findByOwner(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['ownerId', 'collaborators.userId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get itineraries',
      error: error.message,
    });
  }
};

/**
 * Get public itineraries (for discovery)
 */
export const getPublicItineraries = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await itineraryRepo.findPublic({
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['ownerId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get public itineraries',
      error: error.message,
    });
  }
};

/**
 * Get itinerary by ID (public if isPublic, otherwise check permissions)
 */
export const getItineraryById = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id, [
      'ownerId',
      'collaborators.userId',
      'days.stops.locationId',
      'days.stops.hotelId',
      'days.stops.transportId',
      'budget.expenses.paidBy',
      'budget.expenses.splitAmong',
    ]);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    // Check access
    const isOwner = req.user && itinerary.ownerId._id.toString() === req.user._id.toString();
    const isCollaborator = req.user && itinerary.collaborators.some(
      c => c.userId._id.toString() === req.user._id.toString()
    );

    if (!itinerary.isPublic && !isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get itinerary',
      error: error.message,
    });
  }
};

/**
 * Update itinerary
 */
export const updateItinerary = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    // Check permissions
    const isOwner = itinerary.ownerId.toString() === req.user._id.toString();
    const collaborator = itinerary.collaborators.find(
      c => c.userId.toString() === req.user._id.toString()
    );
    const canEdit = isOwner || (collaborator && collaborator.permission === 'edit');

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this itinerary',
      });
    }

    const updatedItinerary = await itineraryRepo.update(req.params.id, req.body);
    await itineraryRepo.updateCompleteness(req.params.id);

    res.json({
      success: true,
      message: 'Itinerary updated successfully',
      data: updatedItinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary',
      error: error.message,
    });
  }
};

/**
 * Delete itinerary (owner only)
 */
export const deleteItinerary = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    if (itinerary.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can delete this itinerary',
      });
    }

    await itineraryRepo.delete(req.params.id);

    res.json({
      success: true,
      message: 'Itinerary deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary',
      error: error.message,
    });
  }
};

/**
 * Add collaborator to itinerary (owner only)
 */
export const addCollaborator = async (req, res) => {
  try {
    const { userId, permission = 'view' } = req.body;

    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    if (itinerary.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can add collaborators',
      });
    }

    const updated = await itineraryRepo.addCollaborator(req.params.id, userId, permission);

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator',
      error: error.message,
    });
  }
};

/**
 * Remove collaborator from itinerary (owner only)
 */
export const removeCollaborator = async (req, res) => {
  try {
    const { userId } = req.body;

    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    if (itinerary.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can remove collaborators',
      });
    }

    const updated = await itineraryRepo.removeCollaborator(req.params.id, userId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove collaborator',
      error: error.message,
    });
  }
};

/**
 * Add expense to itinerary budget
 */
export const addExpense = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    // Check permissions
    const isOwner = itinerary.ownerId.toString() === req.user._id.toString();
    const collaborator = itinerary.collaborators.find(
      c => c.userId.toString() === req.user._id.toString()
    );
    const canEdit = isOwner || (collaborator && collaborator.permission === 'edit');

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this itinerary',
      });
    }

    const expense = {
      ...req.body,
      paidBy: req.user._id,
      date: req.body.date || new Date(),
    };

    if (!itinerary.budget) {
      itinerary.budget = { total: 0, currency: 'USD', expenses: [] };
    }

    itinerary.budget.expenses.push(expense);
    await itinerary.save();

    res.json({
      success: true,
      message: 'Expense added successfully',
      data: itinerary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error.message,
    });
  }
};
