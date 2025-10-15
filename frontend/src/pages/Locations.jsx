import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, MapPin, Star, Compass, RefreshCcw, User } from 'lucide-react';
import api from '../lib/api';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

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
                <div key={location._id} className="card flex h-full flex-col gap-4">
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt={location.name}
                      className="h-40 w-full rounded-lg object-cover"
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
