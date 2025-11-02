import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, MapPin, Star, Compass, RefreshCcw, User, X, Image as ImageIcon, Info, MapPinned, Calendar, Clock, DollarSign, Eye } from 'lucide-react';
import api from '../lib/api';
import ReviewSection from '../components/ReviewSection';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchLocations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 9 };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (countryFilter !== 'all') params.country = countryFilter;

      const { data = [], pagination: pageInfo = {} } = await api.get('/locations', { params });
      setLocations(data);
      setPagination({
        page: pageInfo.page || page,
        pages: pageInfo.pages || 1,
        total: pageInfo.total || data.length,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, countryFilter]);

  useEffect(() => {
    fetchLocations(1);
  }, [fetchLocations]);

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(locations.map((item) => item.category).filter(Boolean))).sort();
    return ['all', ...values];
  }, [locations]);

  const countryOptions = useMemo(() => {
    const values = Array.from(new Set(locations.map((item) => item.country).filter(Boolean))).sort();
    return ['all', ...values];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;
    const term = search.trim().toLowerCase();
    return locations.filter((location) => {
      return (
        location.name?.toLowerCase().includes(term) ||
        location.city?.toLowerCase().includes(term) ||
        location.country?.toLowerCase().includes(term)
      );
    });
  }, [locations, search]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setCountryFilter('all');
    fetchLocations(1);
  };

  const handleViewDetails = (location) => {
    setSelectedLocation(location);
    setShowDetails(true);
  };

  const refreshLocationData = async () => {
    if (!selectedLocation) return;
    
    try {
      const response = await api.get(`/locations/${selectedLocation._id}`);
      if (response.data) {
        setSelectedLocation(response.data);
        // Update in the list as well
        setLocations(prev => prev.map(loc => 
          loc._id === response.data._id ? response.data : loc
        ));
      }
    } catch (error) {
      console.error('Failed to refresh location:', error);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  if (showDetails && selectedLocation) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              {selectedLocation.name}
            </h2>
            <button
              onClick={() => {
                setShowDetails(false);
                setSelectedLocation(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={28} />
            </button>
          </div>

          {/* Images Gallery */}
          {selectedLocation.images && selectedLocation.images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="text-blue-600" />
                Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLocation.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getImageUrl(image.url || image)}
                      alt={`${selectedLocation.name} - ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm rounded-b-lg">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Info className="text-blue-600" />
                  Basic Information
                </h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <p className="text-gray-900">{selectedLocation.city}, {selectedLocation.country}</p>
                  </div>
                  {selectedLocation.address && (
                    <div>
                      <span className="font-semibold text-gray-700">Address:</span>
                      <p className="text-gray-900">{selectedLocation.address}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Category:</span>
                    <p className="text-gray-900 capitalize">{selectedLocation.category}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Rating:</span>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-500 fill-yellow-500" size={18} />
                      <span className="text-gray-900 font-semibold">
                        {selectedLocation.rating?.average?.toFixed(1) || '0.0'} 
                        <span className="text-gray-500 text-sm ml-1">
                          ({selectedLocation.rating?.count || 0} reviews)
                        </span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Views:</span>
                    <p className="text-gray-900 flex items-center gap-1">
                      <Eye size={16} />
                      {selectedLocation.views || 0}
                    </p>
                  </div>
                  {selectedLocation.guideId && (
                    <div>
                      <span className="font-semibold text-gray-700">Guide:</span>
                      <p className="text-gray-900 flex items-center gap-1">
                        <User size={16} />
                        {selectedLocation.guideId.profile
                          ? `${selectedLocation.guideId.profile.firstName || ''} ${selectedLocation.guideId.profile.lastName || ''}`.trim()
                          : selectedLocation.guideId.username || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Coordinates */}
              {selectedLocation.coordinates?.latitude && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPinned className="text-blue-600" />
                    GPS Coordinates
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Latitude:</span>
                      <span className="text-gray-900">{selectedLocation.coordinates.latitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Longitude:</span>
                      <span className="text-gray-900">{selectedLocation.coordinates.longitude}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.coordinates.latitude},${selectedLocation.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full mt-2"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Visiting Information */}
            <div className="space-y-6">
              {/* Best Time to Visit */}
              {selectedLocation.bestTimeToVisit && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Best Time to Visit
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedLocation.bestTimeToVisit}</p>
                  </div>
                </div>
              )}

              {/* Opening Hours */}
              {selectedLocation.openingHours && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-blue-600" />
                    Opening Hours
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedLocation.openingHours}</p>
                  </div>
                </div>
              )}

              {/* Entry Fee */}
              {selectedLocation.entryFee?.amount && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="text-blue-600" />
                    Entry Fee
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedLocation.entryFee.currency} {selectedLocation.entryFee.amount}
                    </div>
                    {selectedLocation.entryFee.details && (
                      <p className="text-sm text-gray-700">{selectedLocation.entryFee.details}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="text-blue-600" />
              Description
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                {selectedLocation.description}
              </p>
            </div>
          </div>

          {/* Attractions */}
          {selectedLocation.attractions && selectedLocation.attractions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Compass className="text-blue-600" />
                Attractions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLocation.attractions.map((attraction, index) => (
                  <div key={index} className="bg-purple-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-900 flex-1">{attraction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {selectedLocation.activities && selectedLocation.activities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Compass className="text-blue-600" />
                Activities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLocation.activities.map((activity, index) => (
                  <div key={index} className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-900 flex-1">{activity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <ReviewSection 
            reviewType="location"
            referenceId={selectedLocation._id}
            locationName={selectedLocation.name}
            guideId={selectedLocation.guideId?._id || selectedLocation.guideId}
            onReviewSubmitted={refreshLocationData}
          />

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              onClick={() => {
                setShowDetails(false);
                setSelectedLocation(null);
              }}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Discover Locations</h1>
        <p className="text-gray-600">
          Browse approved destinations curated by verified local guides. Pending submissions show with a badge so teammates can review.
        </p>
      </div>

      <div className="card">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, city, or country"
              className="input w-full pl-10"
            />
          </div>
          <select
            className="input"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Categories' : option.replace('-', ' ')}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={countryFilter}
            onChange={(event) => setCountryFilter(event.target.value)}
          >
            {countryOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Countries' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner" />
          <p className="mt-4 text-gray-600">Loading locations...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No locations match your filters yet.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-primary mt-4 inline-flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => {
              const coverImage = location.images?.[0]?.url;
              const guideName = location.guideId?.profile
                ? `${location.guideId.profile.firstName || ''} ${location.guideId.profile.lastName || ''}`.trim()
                : location.guideId?.username;
              const approvalStatus = location.approvalStatus;
              const awaitingApproval = approvalStatus && approvalStatus !== 'approved';
              const statusLabel = approvalStatus === 'rejected' ? 'Rejected' : 'Pending approval';
              const statusClass = approvalStatus === 'rejected'
                ? 'border-red-100 bg-red-50 text-red-700'
                : 'border-amber-100 bg-amber-50 text-amber-700';

              return (
                <div 
                  key={location._id} 
                  className="card flex h-full flex-col gap-4 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => handleViewDetails(location)}
                >
                  {coverImage && (
                    <img
                      src={getImageUrl(coverImage)}
                      alt={location.name}
                      className="h-40 w-full rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {location.city}, {location.country}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs">
                        {location.category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                            <Compass className="h-3.5 w-3.5" />
                            {location.category.replace('-', ' ')}
                          </span>
                        )}
                        {awaitingApproval && (
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3">{location.description}</p>

                    <div className="mt-auto flex items-center justify-between text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {guideName || 'Guide'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                        <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                        {location.rating?.average?.toFixed(1) || '0.0'}
                        <span className="text-gray-400">
                          ({location.rating?.count || 0})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pagination.pages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => fetchLocations(page)}
                    className={`rounded px-4 py-2 text-sm ${
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
        </>
      )}
    </div>
  );
};

export default Locations;
