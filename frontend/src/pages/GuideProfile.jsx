import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getImageUrlFromMixed } from '../lib/media';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  Languages, 
  Mail, 
  Phone, 
  MessageCircle,
  Award,
  Calendar,
  ArrowLeft,
  Bus,
  Camera,
  CheckCircle,
  ExternalLink,
  Hotel as HotelIcon,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const GuideProfile = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transports, setTransports] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, title: '', comment: '' });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchGuideData = useCallback(async () => {
    try {
      setLoading(true);
      const [guideRes, reviewsRes, locationsRes, hotelsRes, transportsRes, itinerariesRes] = await Promise.all([
        api.get(`/guides/${id}`),
        api.get('/reviews', { params: { reviewType: 'guide', referenceId: id } }),
        api.get('/locations', { params: { guideId: id, limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/hotels', { params: { guideId: id, limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/transportation', { params: { guideId: id, limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/itineraries/public', { params: { guideId: id, createdByRole: 'guide', limit: 100 } }).catch(() => ({ data: [] })),
      ]);
      setGuide(guideRes.data);
      setReviews(reviewsRes.data);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : []);
      setTransports(Array.isArray(transportsRes.data) ? transportsRes.data : []);
      setItineraries(Array.isArray(itinerariesRes?.data) ? itinerariesRes.data : []);
    } catch (error) {
      toast.error('Failed to load guide profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGuideData();
  }, [fetchGuideData]);

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

  const getImageUrl = (image) => getImageUrlFromMixed(image);

  const totalContributions = locations.length + hotels.length + transports.length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading guide profile...</p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600">Guide not found</p>
        <button onClick={() => navigate('/guides')} className="mt-4 text-blue-600 hover:underline">
          Back to Guides
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/guides')} 
            className="mb-6 h-10 w-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-40 h-40 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 border-4 border-white/30 shadow-2xl">
              {guide.profile?.avatar ? (
                <img
                  src={guide.profile.avatar}
                  alt={guide.username}
                  className="w-full h-full rounded-3xl object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-white">
                  {guide.username[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">
                {guide.profile?.firstName && guide.profile?.lastName
                  ? `${guide.profile.firstName} ${guide.profile.lastName}`
                  : guide.username}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {guide.guideInfo?.rating?.average > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Star className="h-5 w-5" fill="currentColor" />
                    <span className="font-bold text-lg">{guide.guideInfo.rating.average.toFixed(1)}</span>
                    <span className="text-white/90">({guide.guideInfo.rating.count || 0} reviews)</span>
                  </div>
                )}
                {guide.guideInfo?.verificationStatus === 'approved' && (
                  <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Verified Guide</span>
                  </div>
                )}
                {guide.profile?.location && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                    <span>{guide.profile.location}</span>
                  </div>
                )}
              </div>

              {guide.profile?.bio && (
                <p className="text-xl text-white/95 leading-relaxed max-w-3xl mb-6">
                  {guide.profile.bio}
                </p>
              )}

              {/* Action Buttons */}
              {user && user._id !== guide._id && (
                <div className="mb-6">
                  <button
                    onClick={() => navigate(`/chat/${guide._id}`)}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold shadow-lg transition flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with {guide.profile?.firstName || guide.username}
                  </button>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-3xl font-bold">{totalContributions}</div>
                  <div className="text-sm text-white/80">Total Contributions</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-3xl font-bold">{locations.length}</div>
                  <div className="text-sm text-white/80">Locations</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-3xl font-bold">{hotels.length}</div>
                  <div className="text-sm text-white/80">Hotels</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-3xl font-bold">{transports.length}</div>
                  <div className="text-sm text-white/80">Transports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b">
          {['overview', 'locations', 'hotels', 'transport', 'itineraries', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab}
              {tab === 'locations' && ` (${locations.length})`}
              {tab === 'hotels' && ` (${hotels.length})`}
              {tab === 'transport' && ` (${transports.length})`}
              {tab === 'itineraries' && ` (${itineraries.length})`}
              {tab === 'reviews' && ` (${reviews.length})`}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Professional Details */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                    Professional Details
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    {guide.guideInfo?.experience && (
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Award className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Experience</p>
                          <p className="text-lg font-semibold text-gray-900">{guide.guideInfo.experience}</p>
                        </div>
                      </div>
                    )}

                    {guide.guideInfo?.availability && (
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Availability</p>
                          <p className="text-lg font-semibold text-gray-900">{guide.guideInfo.availability}</p>
                        </div>
                      </div>
                    )}

                    {guide.profile?.languages && guide.profile.languages.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Languages className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Languages</p>
                          <p className="text-lg font-semibold text-gray-900">{guide.profile.languages.join(', ')}</p>
                        </div>
                      </div>
                    )}

                    {guide.guideInfo?.priceRange && (
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Price Range</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${guide.guideInfo.priceRange.min} - ${guide.guideInfo.priceRange.max}/day
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  {guide.profile?.specialties && guide.profile.specialties.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {guide.profile.specialties.map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium border border-blue-200"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Work Highlights */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                    Recent Work Highlights
                  </h2>

                  <div className="grid gap-4">
                    {locations.slice(0, 3).map((location) => (
                      <Link
                        key={location._id}
                        to={`/locations/${location._id}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all"
                      >
                        {location.images?.[0] && getImageUrl(location.images[0]) ? (
                          <img
                            src={getImageUrl(location.images[0])}
                            alt={location.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <p className="text-sm text-gray-600">{location.category}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}

                    {hotels.slice(0, 3).map((hotel) => (
                      <Link
                        key={hotel._id}
                        to={`/hotels/${hotel._id}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all"
                      >
                        {hotel.images?.[0] && getImageUrl(hotel.images[0]) ? (
                          <img
                            src={getImageUrl(hotel.images[0])}
                            alt={hotel.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center">
                            <HotelIcon className="w-8 h-8 text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                          <p className="text-sm text-gray-600">{hotel.address?.city}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}

                    {transports.slice(0, 2).map((transport) => (
                      <Link
                        key={transport._id}
                        to={`/transportation/${transport._id}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all"
                      >
                        <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                          <Bus className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transport.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{transport.type}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <MapPin className="h-7 w-7 text-blue-600" />
                  Locations ({locations.length})
                </h2>
                
                {locations.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No locations added yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {locations.map((location) => (
                      <Link
                        key={location._id}
                        to={`/locations/${location._id}`}
                        className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all"
                      >
                        {location.images?.[0] && getImageUrl(location.images[0]) ? (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={getImageUrl(location.images[0])}
                              alt={location.name}
                              className="w-full h-full object-cover"
                            />
                            {location.images.length > 1 && (
                              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Camera className="w-4 h-4" />
                                {location.images.length}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <MapPin className="w-16 h-16 text-blue-400 opacity-50" />
                          </div>
                        )}
                        
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 capitalize">{location.category}</p>
                          {location.description && (
                            <p className="text-sm text-gray-700 line-clamp-2">{location.description}</p>
                          )}
                          {location.rating?.average > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{location.rating.average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === 'hotels' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <HotelIcon className="h-7 w-7 text-purple-600" />
                  Hotels ({hotels.length})
                </h2>
                
                {hotels.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No hotels added yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {hotels.map((hotel) => (
                      <Link
                        key={hotel._id}
                        to={`/hotels/${hotel._id}`}
                        className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-lg transition-all"
                      >
                        {hotel.images?.[0] && getImageUrl(hotel.images[0]) ? (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={getImageUrl(hotel.images[0])}
                              alt={hotel.name}
                              className="w-full h-full object-cover"
                            />
                            {hotel.images.length > 1 && (
                              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <Camera className="w-4 h-4" />
                                {hotel.images.length}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            <HotelIcon className="w-16 h-16 text-purple-400 opacity-50" />
                          </div>
                        )}
                        
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{hotel.address?.city}</span>
                          </div>
                          {hotel.description && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">{hotel.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {hotel.rating?.average > 0 && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{hotel.rating.average.toFixed(1)}</span>
                              </div>
                            )}
                            {hotel.rooms?.length > 0 && (
                              <span className="text-sm text-gray-600">{hotel.rooms.length} rooms</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transport Tab */}
            {activeTab === 'transport' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Bus className="h-7 w-7 text-green-600" />
                  Transportation ({transports.length})
                </h2>
                
                {transports.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No transport services added yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {transports.map((transport) => (
                      <Link
                        key={transport._id}
                        to={`/transportation/${transport._id}`}
                        className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-green-400 hover:shadow-lg transition-all"
                      >
                        {transport.images?.[0] && getImageUrl(transport.images[0]) ? (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={getImageUrl(transport.images[0])}
                              alt={transport.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                            <Bus className="w-16 h-16 text-green-400 opacity-50" />
                          </div>
                        )}
                        
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{transport.name}</h3>
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm capitalize mb-3">
                            {transport.type.replace('-', ' ')}
                          </span>
                          {transport.route?.from?.name && transport.route?.to?.name && (
                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                              <MapPin className="w-4 h-4" />
                              <span>{transport.route.from.name} → {transport.route.to.name}</span>
                            </div>
                          )}
                          {transport.pricing?.amount && (
                            <div className="text-lg font-bold text-green-600">
                              {transport.pricing.currency} {transport.pricing.amount}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Itineraries Tab */}
            {activeTab === 'itineraries' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                    Itineraries
                  </h2>
                </div>

                {itineraries.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No itineraries published yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {itineraries.map((it) => (
                      <Link
                        key={it._id}
                        to={`/itineraries/${it._id}`}
                        className="group border border-gray-200 hover:border-blue-300 rounded-xl p-5 transition-all hover:shadow-lg bg-white"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {it.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        {it.destination && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {it.destination}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">Days: {Array.isArray(it.days) ? it.days.length : 0}</p>
                        {it.pricing?.amount && (
                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {it.pricing.currency || ''} {it.pricing.amount}
                          </p>
                        )}
                        {it.pricing?.contactForPrice && (
                          <p className="text-xs text-gray-500 mt-1">Contact for price</p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Star className="h-7 w-7 text-yellow-500" />
                    Reviews ({reviews.length})
                  </h2>
                  {user && user.role === 'user' && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={reviewData.title}
                          onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                          placeholder="Summarize your experience"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review
                        </label>
                        <textarea
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          value={reviewData.comment}
                          onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                          placeholder="Share your experience with this guide..."
                          required
                        ></textarea>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all">
                          Submit Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-blue-600">
                                {review.userId?.username?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">
                                {review.userId?.username || 'Anonymous'}
                              </span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">{review.title}</h4>
                        )}
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Guide</h3>
              <div className="space-y-3">
                {guide.guideInfo?.contactMethods?.email && (
                  <a
                    href={`mailto:${guide.guideInfo.contactMethods.email}`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Mail className="h-5 w-5" />
                    Send Email
                  </a>
                )}
                {guide.guideInfo?.contactMethods?.phone && (
                  <a
                    href={`tel:${guide.guideInfo.contactMethods.phone}`}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Phone className="h-5 w-5" />
                    {guide.guideInfo.contactMethods.phone}
                  </a>
                )}
                {guide.guideInfo?.contactMethods?.whatsapp && (
                  <a
                    href={`https://wa.me/${guide.guideInfo.contactMethods.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                )}

                {guide.guideInfo?.contactMethods?.website && (
                  <a
                    href={guide.guideInfo.contactMethods.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Website
                  </a>
                )}

                {guide.guideInfo?.contactMethods?.facebook && (
                  <a
                    href={guide.guideInfo.contactMethods.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Facebook
                  </a>
                )}

                {guide.guideInfo?.contactMethods?.instagram && (
                  <a
                    href={guide.guideInfo.contactMethods.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Instagram
                  </a>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">Total Work</span>
                  </div>
                  <span className="font-bold text-lg text-blue-600">{totalContributions}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-700">Reviews</span>
                  </div>
                  <span className="font-bold text-lg text-yellow-600">{reviews.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Rating</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">
                    {guide.guideInfo?.rating?.average?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideProfile;
