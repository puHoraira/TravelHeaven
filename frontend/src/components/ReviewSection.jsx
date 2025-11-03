import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Star, ThumbsUp, Camera, X, Send, MessageCircle, 
  Image as ImageIcon, User, Calendar, CheckCircle 
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

/**
 * Strategy Pattern: Review Submission Strategy
 * Different strategies for submitting reviews with or without images
 */
class ReviewSubmissionStrategy {
  async submit(data) {
    throw new Error('Submit method must be implemented');
  }
}

class TextOnlyReviewStrategy extends ReviewSubmissionStrategy {
  async submit(data) {
    return await api.post('/reviews', data);
  }
}

class ImageReviewStrategy extends ReviewSubmissionStrategy {
  async submit(data, images) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') return;
      formData.append(key, data[key]);
    });
    
    images.forEach(image => {
      formData.append('images', image);
    });

    return await api.post('/reviews/with-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

/**
 * Factory Pattern: Review Strategy Factory
 */
class ReviewStrategyFactory {
  static createStrategy(hasImages) {
    return hasImages ? new ImageReviewStrategy() : new TextOnlyReviewStrategy();
  }
}

/**
 * Observer Pattern: Review Update Notifier
 */
class ReviewNotifier {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}

const reviewNotifier = new ReviewNotifier();

/**
 * Decorator Pattern: Review Display Decorator
 * Adds additional formatting and features to review display
 */
class ReviewDecorator {
  constructor(review) {
    this.review = review;
  }

  getFormattedDate() {
    return new Date(this.review.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStarArray() {
    return Array.from({ length: 5 }, (_, i) => i < this.review.rating);
  }

  getUserDisplayName() {
    const user = this.review.userId;
    if (user?.profile?.firstName) {
      return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    }
    return user?.username || 'Anonymous User';
  }

  isVerified() {
    return this.review.isVerified;
  }
}

/**
 * Builder Pattern: Review Form Builder
 */
class ReviewFormBuilder {
  constructor() {
    this.review = {
      rating: 5,
      title: '',
      comment: '',
      images: []
    };
  }

  setRating(rating) {
    this.review.rating = rating;
    return this;
  }

  setTitle(title) {
    this.review.title = title;
    return this;
  }

  setComment(comment) {
    this.review.comment = comment;
    return this;
  }

  addImages(images) {
    this.review.images = images;
    return this;
  }

  build() {
    return this.review;
  }

  reset() {
    this.review = {
      rating: 5,
      title: '',
      comment: '',
      images: []
    };
    return this;
  }
}

/**
 * Main ReviewSection Component
 * Implements Composite Pattern: Contains multiple sub-components
 */
const ReviewSection = ({ reviewType, referenceId, locationName, guideId, onReviewSubmitted, onReviewsChange }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [hasReviewed, setHasReviewed] = useState(false);
  
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Check if user can review (must be a regular user, not guide, and not already reviewed)
  const canReview = user && user.role === 'user' && !hasReviewed && user._id !== guideId;

  // Singleton Pattern: Single instance of form builder
  const formBuilder = new ReviewFormBuilder();

  useEffect(() => {
    fetchReviews();
    checkIfUserReviewed();
    
    // Observer Pattern: Subscribe to review updates
    const updateHandler = (data) => {
      if (data.referenceId === referenceId) {
        fetchReviews();
        checkIfUserReviewed();
      }
    };
    reviewNotifier.subscribe(updateHandler);

    return () => reviewNotifier.unsubscribe(updateHandler);
  }, [referenceId, user]);

  const checkIfUserReviewed = async () => {
    if (!user || user.role !== 'user') {
      setHasReviewed(false);
      return;
    }

    try {
      const response = await api.get('/reviews', {
        params: { reviewType, referenceId, userId: user._id }
      });
      const userReview = response.data?.data?.find(r => r.userId?._id === user._id || r.userId === user._id);
      setHasReviewed(!!userReview);
    } catch (error) {
      console.error('Failed to check review status:', error);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/reviews', {
        params: { reviewType, referenceId, page, limit: 10 }
      });
      
      console.log('Reviews fetched:', response.data); // Debug log
      console.log('Reviews array:', response.data?.data); // Debug log
      console.log('Reviews length:', response.data?.data?.length); // Debug log
      
      const reviewsData = response.data?.data || response.data || [];
      console.log('Setting reviews to:', reviewsData); // Debug log
      
      setReviews(reviewsData);
      setPagination(response.data?.pagination || { page: 1, pages: 1, total: reviewsData.length });
      
      // Notify parent component about reviews change
      if (onReviewsChange) {
        onReviewsChange(reviewsData);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles].slice(0, 5));

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      setSubmitting(true);

      // Builder Pattern: Build review data
      formBuilder
        .setRating(rating)
        .setTitle(data.title)
        .setComment(data.comment);

      const reviewData = {
        reviewType,
        referenceId,
        rating,
        title: data.title,
        comment: data.comment
      };

      // Factory Pattern: Select appropriate submission strategy
      const strategy = ReviewStrategyFactory.createStrategy(images.length > 0);
      
      let response;
      if (images.length > 0) {
        response = await strategy.submit(reviewData, images);
      } else {
        response = await strategy.submit(reviewData);
      }

      toast.success('Review submitted successfully!');
      
      // Observer Pattern: Notify subscribers
      reviewNotifier.notify({ referenceId, action: 'create' });
      
      // Reset form
      reset();
      setRating(5);
      setImages([]);
      setImagePreview([]);
      setShowForm(false);
      setHasReviewed(true);
      formBuilder.reset();
      
      // Fetch updated reviews
      fetchReviews();
      
      // Call parent callback to refresh location data (with slight delay to ensure backend updated)
      if (onReviewSubmitted) {
        setTimeout(() => {
          onReviewSubmitted();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) {
      toast.error('Please login to like reviews');
      return;
    }

    try {
      await api.post(`/reviews/${reviewId}/like`);
      fetchReviews(pagination.page);
      toast.success('Review liked!');
    } catch (error) {
      toast.error('Failed to like review');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary - Composite Pattern */}
      <div className="card">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="text-blue-600" />
          Reviews & Ratings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Average Rating */}
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
            <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="text-gray-600 text-sm">{reviews.length} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{star}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Write a Review
          </button>
        )}

        {user && user.role !== 'user' && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <p className="text-blue-800">
              <strong>Note:</strong> Only regular users can write reviews for locations.
            </p>
          </div>
        )}

        {user && hasReviewed && user.role === 'user' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <p className="text-green-800">
              <CheckCircle className="inline w-5 h-5 mr-2" />
              You have already reviewed this location. Thank you for your feedback!
            </p>
          </div>
        )}

        {!user && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600">Please login as a user to write a review</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Write Your Review</h3>
            <button
              onClick={() => {
                setShowForm(false);
                reset();
                setRating(5);
                setImages([]);
                setImagePreview([]);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your Rating *
              </label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        i < (hoverRating || rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Very Good'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="Summarize your experience"
                {...register('title')}
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                className="input"
                rows="6"
                placeholder="Share your experience about this location. What did you like? What could be improved?"
                {...register('comment', { 
                  required: 'Review comment is required',
                  minLength: { value: 20, message: 'Review must be at least 20 characters' }
                })}
              />
              {errors.comment && (
                <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Photos (Optional, max 5)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="review-images"
                  disabled={images.length >= 5}
                />
                <label 
                  htmlFor="review-images" 
                  className={`cursor-pointer ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {images.length >= 5 
                      ? 'Maximum 5 images reached' 
                      : 'Click to upload photos (max 5MB each)'}
                  </p>
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Review
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                  setRating(5);
                  setImages([]);
                  setImagePreview([]);
                }}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">Be the first to review this {reviewType}!</p>
          </div>
        ) : (
          reviews.map((review) => {
            // Decorator Pattern: Enhance review with additional features
            const decoratedReview = new ReviewDecorator(review);

            return (
              <div key={review._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {decoratedReview.getUserDisplayName()[0].toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* User Info & Rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {decoratedReview.getUserDisplayName()}
                          </h4>
                          {decoratedReview.isVerified() && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <CheckCircle size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {decoratedReview.getFormattedDate()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {decoratedReview.getStarArray().map((filled, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                    )}

                    {/* Review Comment */}
                    <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image.url || image)}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200x150?text=Image';
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(review._id)}
                      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ThumbsUp size={16} className={review.likes?.includes(user?._id) ? 'fill-blue-600 text-blue-600' : ''} />
                      <span>{review.likes?.length || 0} {review.likes?.length === 1 ? 'like' : 'likes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: pagination.pages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => fetchReviews(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
