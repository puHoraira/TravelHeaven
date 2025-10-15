import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Bus,
  Route,
  Clock,
  CalendarCheck,
  DollarSign,
  RefreshCcw,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import api from '../lib/api';

const typeLabels = {
  bus: 'Bus Service',
  train: 'Rail Service',
  taxi: 'Taxi Service',
  'rental-car': 'Rental Car',
  flight: 'Flight',
  boat: 'Boat Service',
  other: 'Transport Service',
};

const Transportation = () => {
  const [transportOptions, setTransportOptions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchTransport = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const { data = [], pagination: pageInfo = {} } = await api.get('/transportation', {
        params: { page, limit: 9, type: typeFilter !== 'all' ? typeFilter : undefined },
      });
      setTransportOptions(data);
      setPagination({
        page: pageInfo.page || page,
        pages: pageInfo.pages || 1,
        total: pageInfo.total || data.length,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to load transportation options');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchTransport(1);
  }, [fetchTransport]);

  const typeOptions = useMemo(() => {
    const values = transportOptions.map((option) => option.type).filter(Boolean);
    const unique = Array.from(new Set(values)).sort();
    return ['all', ...unique];
  }, [transportOptions]);

  const filteredTransport = useMemo(() => {
    if (!search.trim()) return transportOptions;
    const term = search.trim().toLowerCase();
    return transportOptions.filter((option) => {
      const routeMatch = `${option.route?.from || ''} ${option.route?.to || ''}`.toLowerCase();
      return (
        option.name?.toLowerCase().includes(term) ||
        routeMatch.includes(term) ||
        option.type?.toLowerCase().includes(term)
      );
    });
  }, [transportOptions, search]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    fetchTransport(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Transportation Options</h1>
        <p className="text-gray-600">
          Plan your travel with approved transport services and schedules. Submissions that are still pending display a badge for quick review.
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
              placeholder="Search by service name or route"
              className="input w-full pl-10"
            />
          </div>
          <select
            className="input"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Transport Types' : typeLabels[option] || option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner" />
          <p className="mt-4 text-gray-600">Loading transportation options...</p>
        </div>
      ) : filteredTransport.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No transportation options match your filters yet.</p>
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
            {filteredTransport.map((option) => {
              const approvalStatus = option.approvalStatus;
              const awaitingApproval = approvalStatus && approvalStatus !== 'approved';
              const statusLabel = approvalStatus === 'rejected' ? 'Rejected' : 'Pending approval';
              const statusClass = approvalStatus === 'rejected'
                ? 'border-red-100 bg-red-50 text-red-700'
                : 'border-amber-100 bg-amber-50 text-amber-700';

              return (
                <div key={option._id} className="card flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{option.name}</h3>
                      <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <Bus className="h-4 w-4" />
                        {typeLabels[option.type] || 'Transport Service'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      {option.route?.from && option.route?.to && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 font-medium text-purple-700">
                          <Route className="h-3.5 w-3.5" />
                          {option.route.from} → {option.route.to}
                        </span>
                      )}
                      {awaitingApproval && (
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${statusClass}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                  </div>

                {option.description && (
                  <p className="text-sm text-gray-600">{option.description}</p>
                )}

                {(option.route?.stops && option.route.stops.length > 0) && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Stops:</span>{' '}
                    {option.route.stops.slice(0, 4).join(', ')}
                    {option.route.stops.length > 4 && ' ...'}
                  </div>
                )}

                {(option.schedule?.frequency || option.schedule?.operatingHours || option.schedule?.daysOfWeek) && (
                  <div className="grid gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    {option.schedule?.frequency && (
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Frequency: {option.schedule.frequency}
                      </span>
                    )}
                    {option.schedule?.operatingHours && (
                      <span className="inline-flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        Hours: {option.schedule.operatingHours}
                      </span>
                    )}
                    {option.schedule?.daysOfWeek && option.schedule.daysOfWeek.length > 0 && (
                      <span className="inline-flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        Days: {option.schedule.daysOfWeek.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {option.pricing?.amount && (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    {`${option.pricing.currency || 'USD'} ${option.pricing.amount} (${option.pricing.priceType || 'per-person'})`}
                  </div>
                )}

                {(option.contactInfo?.phone || option.contactInfo?.email || option.contactInfo?.website) && (
                  <div className="mt-auto grid gap-2 text-sm text-gray-600">
                    {option.contactInfo?.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {option.contactInfo.phone}
                      </span>
                    )}
                    {option.contactInfo?.email && (
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {option.contactInfo.email}
                      </span>
                    )}
                    {option.contactInfo?.website && (
                      <a
                        href={option.contactInfo.website}
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
                    onClick={() => fetchTransport(page)}
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

export default Transportation;
