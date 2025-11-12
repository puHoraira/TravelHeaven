import { useState, useCallback, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Bus, 
  Train, 
  Car, 
  Plane,
  Ship,
  AlertCircle,
  ExternalLink,
  Phone,
  Star,
  Clock,
  DollarSign,
  Users,
  Wifi,
  Coffee,
  Zap,
  Wind,
  CheckCircle,
  Info,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const TransportIcon = ({ type }) => {
  const icons = {
    bus: Bus,
    train: Train,
    taxi: Car,
    'rental-car': Car,
    flight: Plane,
    boat: Ship,
    launch: Ship,
    cng: Car,
    rickshaw: Car,
  };
  const Icon = icons[type] || Bus;
  return <Icon className="h-5 w-5" />;
};

const TransportSearchDialog = ({ onSearch }) => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transportType, setTransportType] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      toast.error('Please enter both locations');
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get('/transportation/find-routes', {
        params: {
          fromName: fromLocation,
          toName: toLocation,
          ...(transportType && { type: transportType }),
        },
      });

      onSearch(data);
      toast.success('Search complete!');
    } catch (error) {
      toast.error(error?.message || 'Failed to search routes');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold">Find Transport Routes</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              placeholder="e.g., Dhaka"
              className="input w-full pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              placeholder="e.g., Cox's Bazar"
              className="input w-full pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transport Type
          </label>
          <select
            value={transportType}
            onChange={(e) => setTransportType(e.target.value)}
            className="input w-full"
          >
            <option value="">All Types</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="taxi">Taxi</option>
            <option value="flight">Flight</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={searching}
        className="btn btn-primary w-full flex items-center justify-center gap-2"
      >
        <Search className="h-4 w-4" />
        {searching ? 'Searching...' : 'Search Routes'}
      </button>
    </div>
  );
};

const TransportCard = ({ transport, onBook }) => {
  const hasRoute = transport.route?.from?.name && transport.route?.to?.name;
  const nearbyInfo = transport.matchType === 'nearby-stops' ? transport : null;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TransportIcon type={transport.type} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{transport.name}</h3>
            {transport.operator?.name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <span>{transport.operator.name}</span>
                {transport.operator.verified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {transport.averageRating > 0 && (
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{transport.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Route Info */}
      {hasRoute && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>{transport.route.from.name}</span>
            <span className="text-gray-400">→</span>
            <MapPin className="h-4 w-4 text-purple-600" />
            <span>{transport.route.to.name}</span>
          </div>
          {transport.route.distance?.value && (
            <div className="text-xs text-gray-600 mt-1">
              Distance: {transport.route.distance.value} {transport.route.distance.unit}
              {transport.route.duration?.estimated && ` • ${transport.route.duration.estimated}`}
            </div>
          )}
        </div>
      )}

      {/* Nearby Stops Warning */}
      {nearbyInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-900">Walking Required</p>
              <p className="text-orange-700 mt-1">
                • Walk {nearbyInfo.distanceFromOrigin}km to <strong>{nearbyInfo.nearestOriginStop.name}</strong>
              </p>
              <p className="text-orange-700">
                • Get off at <strong>{nearbyInfo.nearestDestinationStop.name}</strong>, then walk {nearbyInfo.distanceFromDestination}km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {transport.description && (
        <p className="text-sm text-gray-600 mb-4">{transport.description}</p>
      )}

      {/* Pricing */}
      {transport.pricing && (
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-bold text-lg text-green-700">
                {transport.pricing.currency} {transport.pricing.amount}
              </span>
            </div>
            <span className="text-sm text-gray-600">{transport.pricing.priceType}</span>
          </div>
          {transport.pricing.priceNote && (
            <p className="text-xs text-gray-500 mt-1">{transport.pricing.priceNote}</p>
          )}
        </div>
      )}

      {/* Schedule */}
      {transport.schedule?.departures && transport.schedule.departures.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4" />
            Departure Times
          </div>
          <div className="flex flex-wrap gap-2">
            {transport.schedule.departures.slice(0, 6).map((time, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                {time}
              </span>
            ))}
            {transport.schedule.departures.length > 6 && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                +{transport.schedule.departures.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Facilities */}
      {transport.facilities && transport.facilities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {transport.facilities.slice(0, 5).map((facility) => {
              const icons = {
                ac: Wind,
                wifi: Wifi,
                charging: Zap,
                snacks: Coffee,
              };
              const Icon = icons[facility] || Info;
              return (
                <span key={facility} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  <Icon className="h-3 w-3" />
                  {facility}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact & Booking */}
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t">
        {transport.booking?.onlineUrl && (
          <a
            href={transport.booking.onlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onBook(transport._id)}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Book Online
          </a>
        )}
        {transport.booking?.phoneNumbers && transport.booking.phoneNumbers[0] && (
          <a
            href={`tel:${transport.booking.phoneNumbers[0]}`}
            className="btn bg-green-600 hover:bg-green-700 text-white flex-1 flex items-center justify-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </a>
        )}
        {transport.contactInfo?.whatsapp && (
          <a
            href={`https://wa.me/${transport.contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 px-4"
          >
            WhatsApp
          </a>
        )}
      </div>

      {/* Stats */}
      {(transport.viewCount > 0 || transport.bookingCount > 0) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500">
          {transport.viewCount > 0 && (
            <span>{transport.viewCount} views</span>
          )}
          {transport.bookingCount > 0 && (
            <span>{transport.bookingCount} bookings</span>
          )}
        </div>
      )}
    </div>
  );
};

const PopularRoutes = () => {
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await api.get('/transportation/popular', {
          params: { limit: 6 },
        });
        setPopular(data || []);
      } catch (error) {
        console.error('Failed to fetch popular routes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, []);

  if (loading) return null;
  if (popular.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold">Popular Routes</h2>
      </div>
      <div className="grid gap-3">
        {popular.map((transport) => (
          <div key={transport._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <TransportIcon type={transport.type} />
              <div>
                <p className="font-medium">{transport.name}</p>
                <p className="text-sm text-gray-600">
                  {transport.route?.from?.name} → {transport.route?.to?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {transport.averageRating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{transport.averageRating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                {transport.bookingCount} bookings
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EnhancedTransportation = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [allTransports, setAllTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // 'all' or 'search'

  const fetchAllTransports = useCallback(async () => {
    try {
      setLoading(true);
      const { data = [] } = await api.get('/transportation', {
        params: { limit: 50 },
      });
      setAllTransports(data);
    } catch (error) {
      toast.error(error?.message || 'Failed to load transportation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTransports();
  }, [fetchAllTransports]);

  const handleSearch = (results) => {
    setSearchResults(results);
    setView('search');
  };

  const handleBookClick = async (transportId) => {
    try {
      await api.post(`/transportation/${transportId}/book`);
    } catch (error) {
      console.error('Failed to track booking:', error);
    }
  };

  const displayTransports = view === 'search' ? searchResults : allTransports;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transportation Services</h1>
        <p className="text-gray-600 mt-2">
          Find transport options for your journey across Bangladesh
        </p>
      </div>

      {/* Search */}
      <TransportSearchDialog onSearch={handleSearch} />

      {/* View Toggle */}
      {searchResults && (
        <div className="flex gap-2">
          <button
            onClick={() => setView('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Search Results ({searchResults.length})
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Transport
          </button>
        </div>
      )}

      {/* Popular Routes Sidebar */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="spinner" />
              <p className="mt-4 text-gray-600">Loading transportation...</p>
            </div>
          ) : displayTransports && displayTransports.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {displayTransports.map((transport) => (
                <TransportCard
                  key={transport._id}
                  transport={transport}
                  onBook={handleBookClick}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600">
                {view === 'search'
                  ? 'No routes found for your search. Try different locations.'
                  : 'No transportation options available yet.'}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <PopularRoutes />
        </div>
      </div>
    </div>
  );
};

export default EnhancedTransportation;
