import { ItineraryRepository } from '../patterns/Repository.js';

const itineraryRepo = new ItineraryRepository();
const VIEW_COOLDOWN_MS = 5 * 60 * 1000;
const viewCooldown = new Map();

const appendActivityEntry = async (itineraryId, entry) => {
  await itineraryRepo.model.findByIdAndUpdate(itineraryId, {
    $push: {
      activityLog: {
        $each: [entry],
        $slice: -100,
      },
    },
  });
};

const buildActivityEntry = (type, message, userId) => ({
  type,
  message,
  createdBy: userId,
  createdAt: new Date(),
});

/**
 * Create new itinerary
 */
export const createItinerary = async (req, res) => {
  try {
    const createdByRole = req.user?.role === 'guide' ? 'guide' : 'user';

    const itineraryData = {
      ...req.body,
      ownerId: req.user._id,
      createdByRole,
      completeness: 0,
    };

    // Enforce role-safe values
    if (createdByRole !== 'guide') {
      itineraryData.pricing = undefined;
    }

    const itinerary = await itineraryRepo.create(itineraryData);
    await itineraryRepo.updateCompleteness(itinerary._id);

    res.status(201).json({
      success: true,
      message: 'Itinerary created successfully',
      data: itinerary,
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
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

    const guideId = req.query.guideId;
    const destination = (req.query.destination || '').toString().trim();
    const createdByRole = req.query.createdByRole;

    const filter = {
      isPublic: true,
    };
    if (guideId) filter.ownerId = guideId;
    if (createdByRole && ['user', 'guide'].includes(createdByRole)) filter.createdByRole = createdByRole;
    if (destination) filter.destination = { $regex: destination, $options: 'i' };

    const result = await itineraryRepo.findAll(filter, {
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

const normalizeAiPlan = (plan) => {
  const p = plan && typeof plan === 'object' ? plan : {};
  const destination = (p.destination || '').toString().trim();
  const title = (p.title || '').toString().trim();
  const startDate = p.startDate ? new Date(p.startDate) : null;
  const endDate = p.endDate ? new Date(p.endDate) : null;

  const normalizeCoordinate = (source) => {
    if (!source) return null;
    const latValue = source.lat ?? source.latitude;
    const lngValue = source.lng ?? source.longitude;
    const lat = typeof latValue === 'number' ? latValue : parseFloat(latValue);
    const lng = typeof lngValue === 'number' ? lngValue : parseFloat(lngValue);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
    return null;
  };

  const days = Array.isArray(p.days) ? p.days : [];
  const normalizedDays = days
    .map((d, idx) => {
      const dayNumber = Number(d.day_number ?? d.dayNumber ?? (idx + 1));
      const dayTitle = (d.title || '').toString();
      const activities = Array.isArray(d.activities) ? d.activities : [];

      const stops = activities
        .filter(Boolean)
        .map((a, aIdx) => ({
          timeOfDay: (a.time_of_day || a.timeOfDay || '').toString(),
          customName: (a.place_name || a.placeName || a.customName || '').toString(),
          customDescription: (a.description || a.customDescription || '').toString(),
          customCoordinates:
            normalizeCoordinate(a.customCoordinates)
            || normalizeCoordinate(a.coordinates)
            || undefined,
          order: aIdx,
        }))
        .filter((s) => s.customName);

      return {
        dayNumber: Number.isFinite(dayNumber) ? dayNumber : idx + 1,
        title: dayTitle || `Day ${idx + 1}`,
        description: (d.description || '').toString(),
        stops,
      };
    })
    .filter((d) => d.stops.length > 0);

  return {
    title,
    destination,
    startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined,
    endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined,
    days: normalizedDays,
    notes: (p.notes || '').toString(),
  };
};

/**
 * Create itinerary from structured AI plan (Traveler)
 * POST /api/itineraries/from-ai
 */
export const createItineraryFromAiPlan = async (req, res) => {
  try {
    const normalized = normalizeAiPlan(req.body);
    if (!normalized.days || normalized.days.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'AI plan must include day-by-day activities',
      });
    }

    const title = normalized.title || (normalized.destination ? `${normalized.destination} Trip Plan` : 'AI Trip Plan');

    const itineraryData = {
      title,
      description: normalized.notes || 'Generated by AI Route Adviser',
      destination: normalized.destination,
      ownerId: req.user._id,
      createdByRole: 'user',
      source: 'ai-route-adviser',
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      isPublic: false,
      status: 'planning',
      days: normalized.days,
      tags: ['ai-generated', 'ai-route-adviser'],
      completeness: 0,
    };

    const created = await itineraryRepo.create(itineraryData);
    await itineraryRepo.updateCompleteness(created._id);

    res.status(201).json({
      success: true,
      message: 'AI itinerary saved successfully',
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary from AI plan',
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
    await appendActivityEntry(req.params.id, buildActivityEntry('update', 'Itinerary content updated', req.user._id));

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

    await appendActivityEntry(
      req.params.id,
      buildActivityEntry('update', `Added collaborator (${permission})`, req.user._id)
    );

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

    await appendActivityEntry(
      req.params.id,
      buildActivityEntry('update', 'Removed collaborator', req.user._id)
    );

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
    await appendActivityEntry(
      req.params.id,
      buildActivityEntry('update', `Added expense ${expense.name}`, req.user._id)
    );

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

/**
 * Like/Unlike itinerary
 */
export const toggleLikeItinerary = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    if (!itinerary.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Only public itineraries can be liked',
      });
    }

    const userIndex = itinerary.likes.findIndex(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (userIndex > -1) {
      itinerary.likes.splice(userIndex, 1);
    } else {
      itinerary.likes.push(req.user._id);
    }

    await itinerary.save();

    res.json({
      success: true,
      message: userIndex > -1 ? 'Itinerary unliked' : 'Itinerary liked',
      data: { likes: itinerary.likes.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message,
    });
  }
};

/**
 * Increment itinerary views
 */
export const incrementViews = async (req, res) => {
  try {
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    const keyBase = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
    const cooldownKey = `${keyBase}:${itinerary._id.toString()}`;

    const lastView = viewCooldown.get(cooldownKey);
    if (lastView && Date.now() - lastView < VIEW_COOLDOWN_MS) {
      return res.json({
        success: true,
        data: { views: itinerary.views },
        message: 'View already counted recently',
      });
    }

    itinerary.views = (itinerary.views || 0) + 1;
    await itinerary.save();
    viewCooldown.set(cooldownKey, Date.now());

    res.json({
      success: true,
      data: { views: itinerary.views },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to increment views',
      error: error.message,
    });
  }
};

export const addCollaborationActivity = async (req, res) => {
  try {
    const { type, message } = req.body;
    const itinerary = await itineraryRepo.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }

    const isOwner = itinerary.ownerId.toString() === req.user._id.toString();
    const collaborator = itinerary.collaborators.find(
      c => c.userId.toString() === req.user._id.toString()
    );

    const allowedPermissions = ['edit', 'comment', 'suggest'];
    const canContribute = isOwner || (collaborator && allowedPermissions.includes(collaborator.permission));

    if (!canContribute) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add collaboration activity',
      });
    }

    const activityType = type === 'suggestion' ? 'suggestion' : 'comment';
    const entry = buildActivityEntry(activityType, message, req.user._id);

    await appendActivityEntry(req.params.id, entry);

    res.status(201).json({
      success: true,
      message: 'Collaboration activity recorded',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record collaboration activity',
      error: error.message,
    });
  }
};
