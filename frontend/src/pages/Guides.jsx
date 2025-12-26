import { DollarSign, Languages, MapPin, Search, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import './Guides.css';

const Guides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [pagination, setPagination] = useState({});

  const fetchGuides = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const { data = [], pagination: pageInfo = {} } = await api.get('/guides', {
        params: { page, limit: 12, search, sortBy },
      });
      setGuides(data);
      setPagination({
        page: pageInfo.page || page,
        pages: pageInfo.pages || 1,
        total: pageInfo.total || data.length,
      });
    } catch (error) {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Find Your Travel Guide</h1>
      </div>

      {/* Search and Filters */}
      <div className="card guides-filters">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search guides by name, specialty, or location..."
              className="input pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Highest Rated</option>
            <option value="name">Name (A-Z)</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Guides Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading guides...</p>
        </div>
      ) : guides.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No guides found.</p>
        </div>
      ) : (
        <>
          <div className="guides-grid">
            {guides.map((guide) => (
              <Link
                key={guide._id}
                to={`/guides/${guide._id}`}
                className="guide-card card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {guide.profile?.avatar ? (
                      <img
                        src={guide.profile.avatar}
                        alt={guide.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {guide.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {guide.profile?.firstName && guide.profile?.lastName
                        ? `${guide.profile.firstName} ${guide.profile.lastName}`
                        : guide.username}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {guide.guideInfo?.rating?.average?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({guide.guideInfo?.rating?.count || 0} reviews)
                      </span>
                    </div>

                    {/* Bio */}
                    {guide.profile?.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {guide.profile.bio}
                      </p>
                    )}

                    {/* Location */}
                    {guide.profile?.location && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {guide.profile.location}
                      </div>
                    )}

                    {/* Price Range */}
                    {guide.guideInfo?.priceRange && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        ${guide.guideInfo.priceRange.min} - ${guide.guideInfo.priceRange.max}
                      </div>
                    )}

                    {/* Languages */}
                    {guide.profile?.languages && guide.profile.languages.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                        <Languages className="w-4 h-4" />
                        {guide.profile.languages.slice(0, 2).join(', ')}
                        {guide.profile.languages.length > 2 && ' +more'}
                      </div>
                    )}

                    {/* Specialties */}
                    {guide.profile?.specialties && guide.profile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {guide.profile.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchGuides(page)}
                  className={`pagination-button px-4 py-2 rounded ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Guides;
