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
    const { reviewType, referenceId, rating, title, comment } = req.body;

    // Handle uploaded images
    const images = req.files
      ? req.files
          .filter((file) => file?.mongoId)
          .map((file) => ({
            file: file.mongoId,
            caption: '',
          }))
      : [];

    // Parse images from body if sent as JSON (non-multipart request)
    let parsedImages = images;
    if (!req.files && req.body.images) {
      try {
        parsedImages = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
      } catch (e) {
        parsedImages = [];
      }
    }

    const isVerified = await hasCompletedBooking(req.user._id, reviewType, referenceId);

    // Create review
    const review = await reviewRepo.create({
      userId: req.user._id,
      reviewType,
      referenceId,
      rating: parseInt(rating),
      title,
      comment,
      images: parsedImages,
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
      populate: ['userId', 'images.file'],
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
      populate: ['images.file'],
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

    const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

    const normalizeImages = (raw) => {
      if (!raw) return undefined;

      let parsed = raw;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = undefined;
        }
      }

      if (!Array.isArray(parsed)) return undefined;

      return parsed
        .map((img) => {
          if (!img) return null;

          if (typeof img === 'string') {
            return isObjectId(img) ? { file: img, caption: '' } : null;
          }

          const file = img.file;
          if (isObjectId(file)) return { file, caption: img.caption || '' };
          if (file && typeof file === 'object' && isObjectId(file._id)) {
            return { file: file._id, caption: img.caption || '' };
          }

          return null;
        })
        .filter(Boolean);
    };

    const normalizedImages = normalizeImages(images);

    const updatedReview = await reviewRepo.update(id, {
      rating,
      title,
      comment,
      ...(normalizedImages !== undefined ? { images: normalizedImages } : {}),
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
  try {
    console.log(`🔄 Updating rating for ${reviewType} ${referenceId}`);
    
    const { average, count } = await reviewRepo.getAverageRating(reviewType, referenceId);
    console.log(`📊 Calculated rating: ${average} (${count} reviews)`);

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
        console.log(`✅ Guide rating updated`);
        return;
      default:
        console.warn(`⚠️ Unknown review type: ${reviewType}`);
        return;
    }

    if (repository) {
      const result = await repository.update(referenceId, {
        'rating.average': average,
        'rating.count': count,
      });
      console.log(`✅ ${reviewType} rating updated:`, result);
    }
  } catch (error) {
    console.error(`❌ Error updating entity rating:`, error);
    throw error;
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
