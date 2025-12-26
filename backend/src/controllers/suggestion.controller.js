import { HotelRepository, ItineraryRepository, LocationRepository } from '../patterns/Repository.js';

const locationRepo = new LocationRepository();
const hotelRepo = new HotelRepository();
const itineraryRepo = new ItineraryRepository();

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * GET /api/suggestions/dashboard
 * Returns suggested content for traveler dashboard.
 */
export const getTravelerDashboardSuggestions = async (req, res) => {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 5), 1), 12);
    const destination = (req.query.destination || '').toString().trim();

    const [locationsResult, hotelsResult, publicItinerariesResult, myItinerariesResult] = await Promise.all([
      locationRepo.findApproved({}, { page: 1, limit, sort: { views: -1, 'rating.average': -1, createdAt: -1 }, populate: ['guideId'] }),
      hotelRepo.findApproved({}, { page: 1, limit, sort: { views: -1, 'rating.average': -1, createdAt: -1 }, populate: ['locationId', 'guideId'] }),
      itineraryRepo.findAll(
        {
          isPublic: true,
          createdByRole: 'guide',
          ...(destination ? { destination: { $regex: destination, $options: 'i' } } : {}),
        },
        { page: 1, limit, sort: { views: -1, createdAt: -1 }, populate: ['ownerId'] }
      ),
      itineraryRepo.findByOwner(req.user._id, { page: 1, limit, sort: { createdAt: -1 }, populate: ['ownerId'] }),
    ]);

    res.json({
      success: true,
      data: {
        suggestedLocations: locationsResult.data,
        suggestedHotels: hotelsResult.data,
        suggestedItineraries: publicItinerariesResult.data,
        myRecentItineraries: myItinerariesResult.data,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load suggestions',
      error: error.message,
    });
  }
};
