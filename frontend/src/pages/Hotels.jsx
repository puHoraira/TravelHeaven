import {
  Building2,
  DollarSign,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getImageUrlFromMixed } from '../lib/media';
import './Hotels.css';

const formatPriceRange = (priceRange) => {
  if (!priceRange) return 'Pricing unavailable';
  const currency = priceRange.currency || 'USD';
  if (priceRange.min && priceRange.max) {
    return `${currency} ${priceRange.min} - ${priceRange.max} per night`;
  }
  if (priceRange.min) {
    return `From ${currency} ${priceRange.min} per night`;
  }
  if (priceRange.max) {
    return `Up to ${currency} ${priceRange.max} per night`;
  }
  return 'Pricing unavailable';
};

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const fetchHotels = async (page = 1) => {
    try {
      setLoading(true);
      const { data = [], pagination: pageInfo = {} } = await api.get('/hotels', {
        params: { page, limit: 9 },
      });
      setHotels(data);
      setPagination({
        page: pageInfo.page || page,
        pages: pageInfo.pages || 1,
        total: pageInfo.total || data.length,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels(1);
  }, []);

  const cityOptions = useMemo(() => {
    const values = hotels
      .map((hotel) => hotel.address?.city || hotel.locationId?.city)
      .filter(Boolean);
    const unique = Array.from(new Set(values)).sort();
    return ['all', ...unique];
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return hotels.filter((hotel) => {
      const hotelCity = (hotel.address?.city || hotel.locationId?.city || '').toLowerCase();
      const matchesSearch = !term
        ? true
        : hotel.name?.toLowerCase().includes(term) ||
          hotel.locationId?.name?.toLowerCase().includes(term) ||
          hotelCity.includes(term);
      const matchesCity = cityFilter === 'all' || hotelCity === cityFilter.toLowerCase();
      const hotelRating = hotel.rating?.average || 0;
      const matchesRating = ratingFilter === 'all' || hotelRating >= Number(ratingFilter);
      return matchesSearch && matchesCity && matchesRating;
    });
  }, [hotels, search, cityFilter, ratingFilter]);

  const resetFilters = () => {
    setSearch('');
    setCityFilter('all');
    setRatingFilter('all');
    fetchHotels(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Find Hotels</h1>
        <p className="text-gray-600">
          Discover approved accommodations near your dream destinations. Look for the pending badge to spot listings awaiting review.
        </p>
      </div>

      <div className="card hotels-filters">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by hotel name or location"
              className="input w-full pl-10"
            />
          </div>
          <select
            className="input"
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
          >
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Cities' : option}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="4">4 stars & up</option>
            <option value="3">3 stars & up</option>
            <option value="2">2 stars & up</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner" />
          <p className="mt-4 text-gray-600">Loading hotels...</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hotels match your filters yet.</p>
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
          <div className="hotels-grid">
            {filteredHotels.map((hotel) => {
              const coverImage = getImageUrlFromMixed(hotel.images?.[0]);
              const city = hotel.address?.city || hotel.locationId?.city;
              const country = hotel.address?.country || hotel.locationId?.country;
              const approvalStatus = hotel.approvalStatus;
              const awaitingApproval = approvalStatus && approvalStatus !== 'approved';
              const statusLabel = approvalStatus === 'rejected' ? 'Rejected' : 'Pending approval';
              const statusClass = approvalStatus === 'rejected'
                ? 'border-red-100 bg-red-50 text-red-700'
                : 'border-amber-100 bg-amber-50 text-amber-700';

              return (
                <div key={hotel._id} className="hotel-card card flex h-full flex-col gap-4">
                  <Link to={`/hotels/${hotel._id}`}>
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={hotel.name}
                        className="h-40 w-full rounded-lg object-cover hover:opacity-95"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="h-40 w-full rounded-lg bg-gray-100 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                          <ImageIcon className="h-4 w-4" />
                          No image
                        </div>
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/hotels/${hotel._id}`} className="text-lg font-semibold text-gray-900 hover:underline">
                          {hotel.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {city}, {country}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs">
                        {hotel.locationId?.name && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                            <Building2 className="h-3.5 w-3.5" />
                            {hotel.locationId.name}
                          </span>
                        )}
                        {awaitingApproval && (
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3">{hotel.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                        <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                        {hotel.rating?.average?.toFixed(1) || '0.0'}
                        <span className="text-gray-400">({hotel.rating?.count || 0})</span>
                      </span>
                      <span className="inline-flex items-center gap-2 font-medium text-gray-700">
                        <DollarSign className="h-4 w-4" />
                        {formatPriceRange(hotel.priceRange)}
                      </span>
                    </div>

                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-blue-700">
                        {hotel.amenities.slice(0, 4).map((amenity) => (
                          <span key={amenity} className="rounded-full bg-blue-50 px-3 py-1">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    {(hotel.contactInfo?.phone || hotel.contactInfo?.email || hotel.contactInfo?.website) && (
                      <div className="mt-auto grid gap-2 text-sm text-gray-600">
                        {hotel.contactInfo?.phone && (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {hotel.contactInfo.phone}
                          </span>
                        )}
                        {hotel.contactInfo?.email && (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {hotel.contactInfo.email}
                          </span>
                        )}
                        {hotel.contactInfo?.website && (
                          <a
                            href={hotel.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            Visit website
                          </a>
                        )}
                      </div>
                    )}
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
                    onClick={() => fetchHotels(page)}
                    className={`pagination-button rounded px-4 py-2 text-sm ${
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

export default Hotels;
