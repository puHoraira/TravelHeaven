import { ReviewRepository } from '../patterns/Repository.js';
import {
  LocationRepository,
  HotelRepository,
  UserRepository,
  BookingRepository,
} from '../patterns/Repository.js';

const reviewRepo = new ReviewRepository();
const bookingRepo = new BookingRepository();

/**
 * Create a review
 */
export const createReview = async (req, res) => {
  try {
    const { reviewType, referenceId, rating, title, comment, images } = req.body;

    const isVerified = await hasCompletedBooking(req.user._id, reviewType, referenceId);

    // Create review
    const review = await reviewRepo.create({
      userId: req.user._id,
      reviewType,
      referenceId,
      rating,
      title,
      comment,
      images: images || [],
      isVerified,
    });

    // Update the average rating of the referenced entity
    await updateEntityRating(reviewType, referenceId);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

/**
 * Get reviews for an entity
 */
export const getReviews = async (req, res) => {
  try {
    const { reviewType, referenceId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewRepo.findByReference(reviewType, referenceId, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: ['userId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * Get user's reviews
 */
export const getMyReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewRepo.findByUser(req.user._id, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * Update a review
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    const review = await reviewRepo.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews',
      });
    }

    const isVerified = await hasCompletedBooking(req.user._id, review.reviewType, review.referenceId);

    const updatedReview = await reviewRepo.update(id, {
      rating,
      title,
      comment,
      images,
      isVerified,
    });

    // Update the average rating of the referenced entity
    await updateEntityRating(review.reviewType, review.referenceId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewRepo.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
    }

    await reviewRepo.delete(id);

    // Update the average rating of the referenced entity
    await updateEntityRating(review.reviewType, review.referenceId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

/**
 * Like/Unlike a review
 */
export const toggleLikeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewRepo.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const userIndex = review.likes.findIndex(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (userIndex > -1) {
      review.likes.splice(userIndex, 1);
    } else {
      review.likes.push(req.user._id);
    }

    await review.save();

    res.json({
      success: true,
      message: userIndex > -1 ? 'Review unliked' : 'Review liked',
      data: { likes: review.likes.length },
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
 * Helper function to update entity rating
 */
async function updateEntityRating(reviewType, referenceId) {
  const { average, count } = await reviewRepo.getAverageRating(reviewType, referenceId);

  let repository;
  switch (reviewType) {
    case 'location':
      repository = new LocationRepository();
      break;
    case 'hotel':
      repository = new HotelRepository();
      break;
    case 'guide':
      repository = new UserRepository();
      await repository.model.findByIdAndUpdate(referenceId, {
        'guideInfo.rating.average': average,
        'guideInfo.rating.count': count,
      });
      return;
    default:
      return;
  }

  if (repository) {
    await repository.update(referenceId, {
      'rating.average': average,
      'rating.count': count,
    });
  }
}

async function hasCompletedBooking(userId, reviewType, referenceId) {
  const reviewTypeToBookingType = {
    hotel: 'hotel',
    transport: 'transport',
    guide: 'package',
  };

  const bookingType = reviewTypeToBookingType[reviewType];
  if (!bookingType) {
    return false;
  }

  const booking = await bookingRepo.findOne({
    userId,
    bookingType,
    referenceId,
    status: 'completed',
    paymentStatus: 'paid',
  });

  return Boolean(booking);
}
