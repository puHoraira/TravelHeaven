import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  Languages, 
  Mail, 
  Phone, 
  MessageCircle,
  Award,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const GuideProfile = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [guide, setGuide] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    fetchGuideData();
  }, [id]);

  const fetchGuideData = async () => {
    try {
      setLoading(true);
      const [guideRes, reviewsRes] = await Promise.all([
        api.get(`/guides/${id}`),
        api.get('/reviews', { params: { reviewType: 'guide', referenceId: id } }),
      ]);
      setGuide(guideRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      toast.error('Failed to load guide profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        reviewType: 'guide',
        referenceId: id,
        ...reviewData,
      });
      toast.success('Review submitted successfully');
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: '', comment: '' });
      fetchGuideData();
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Guide not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guide Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            {guide.profile?.avatar ? (
              <img
                src={guide.profile.avatar}
                alt={guide.username}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-blue-600">
                {guide.username[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {guide.profile?.firstName && guide.profile?.lastName
                ? `${guide.profile.firstName} ${guide.profile.lastName}`
                : guide.username}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold text-gray-900">
                  {guide.guideInfo?.rating?.average?.toFixed(1) || '0.0'}
                </span>
              </div>
              <span className="text-gray-600">
                ({guide.guideInfo?.rating?.count || 0} reviews)
              </span>
            </div>

            {/* Bio */}
            {guide.profile?.bio && (
              <p className="text-gray-700 mt-4">{guide.profile.bio}</p>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {guide.profile?.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{guide.profile.location}</span>
                </div>
              )}

              {guide.guideInfo?.priceRange && (
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span>
                    ${guide.guideInfo.priceRange.min} - ${guide.guideInfo.priceRange.max}/day
                  </span>
                </div>
              )}

              {guide.profile?.languages && guide.profile.languages.length > 0 && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Languages className="w-5 h-5 text-gray-400" />
                  <span>{guide.profile.languages.join(', ')}</span>
                </div>
              )}

              {guide.guideInfo?.experience && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Award className="w-5 h-5 text-gray-400" />
                  <span>{guide.guideInfo.experience}</span>
                </div>
              )}

              {guide.guideInfo?.availability && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{guide.guideInfo.availability}</span>
                </div>
              )}
            </div>

            {/* Specialties */}
            {guide.profile?.specialties && guide.profile.specialties.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Specialties:</h3>
                <div className="flex flex-wrap gap-2">
                  {guide.profile.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {guide.guideInfo?.contactMethods?.email && (
                <a
                  href={`mailto:${guide.guideInfo.contactMethods.email}`}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
              {guide.guideInfo?.contactMethods?.phone && (
                <a
                  href={`tel:${guide.guideInfo.contactMethods.phone}`}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
              {guide.guideInfo?.contactMethods?.whatsapp && (
                <a
                  href={`https://wa.me/${guide.guideInfo.contactMethods.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
          {user && user.role === 'user' && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn btn-primary"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  className="input"
                  value={reviewData.rating}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, rating: parseInt(e.target.value) })
                  }
                  required
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="input"
                  value={reviewData.title}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review
                </label>
                <textarea
                  className="input"
                  rows={4}
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Share your experience with this guide..."
                  required
                ></textarea>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {review.userId?.username || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-medium text-gray-900 mt-2">{review.title}</h4>
                )}
                <p className="text-gray-700 mt-1">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideProfile;
