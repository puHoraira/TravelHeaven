import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Bus, 
  AlertCircle, 
  ExternalLink, 
  Phone, 
  Loader2,
  Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

/**
 * Transport Search Component for Itinerary Integration
 * Usage: <TransportSearchWidget from="Dhaka" to="Cox's Bazar" fromCoords={[lat,lng]} toCoords={[lat,lng]} />
 */
const TransportSearchWidget = ({ from, to, fromCoords, toCoords, onSelectTransport }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const searchTransport = async () => {
    if (!from || !to) {
      toast.error('From and To locations are required');
      return;
    }

    setLoading(true);
    setExpanded(true);

    try {
      // Prefer GPS coordinates for accurate matching
      const params = {};
      
      if (fromCoords && fromCoords.length === 2 && toCoords && toCoords.length === 2) {
        // Use GPS coordinates (more accurate)
        params.fromLat = fromCoords[0];
        params.fromLng = fromCoords[1];
        params.toLat = toCoords[0];
        params.toLng = toCoords[1];
        console.log('🗺️ Searching by GPS:', params);
      } else {
        // Fallback to location names
        params.fromName = from;
        params.toName = to;
        console.log('📝 Searching by names:', params);
      }

      const { data } = await api.get('/transportation/find-routes', { params });

      console.log('📦 API Response:', data);
      console.log('📦 data.success:', data.success);
      console.log('📦 data.data:', data.data);
      console.log('📦 data.data type:', typeof data.data);
      console.log('📦 directRoutes:', data.data?.directRoutes);
      console.log('📦 nearbyRoutes:', data.data?.nearbyRoutes);

      // Handle different response structures
      let transportList = [];
      
      // Check if data has success wrapper
      const responseData = data.success ? data.data : data;
      console.log('📦 responseData:', responseData);
      
      if (responseData && (responseData.directRoutes || responseData.nearbyRoutes)) {
        // GPS search returns: {directRoutes: [], nearbyRoutes: [], totalOptions: 2}
        const { directRoutes = [], nearbyRoutes = [] } = responseData;
        console.log('✅ Extracted directRoutes:', directRoutes, 'length:', directRoutes.length);
        console.log('✅ Extracted nearbyRoutes:', nearbyRoutes, 'length:', nearbyRoutes.length);
        transportList = [...directRoutes, ...nearbyRoutes];
        console.log('✅ Combined transportList:', transportList, 'length:', transportList.length);
      } else if (Array.isArray(responseData)) {
        // Name search returns: array of transports
        transportList = responseData;
        console.log('✅ Array data:', transportList);
      }

      console.log('🎯 Final transportList to setResults:', transportList);
      setResults(transportList);
      
      if (transportList.length === 0) {
        toast('No transport found for this route', { icon: '🚫' });
      } else {
        const directCount = data.data?.directRoutes?.length || 0;
        const nearbyCount = data.data?.nearbyRoutes?.length || 0;
        if (directCount > 0) {
          toast.success(`Found ${directCount} direct route(s)${nearbyCount > 0 ? ` and ${nearbyCount} nearby option(s)` : ''}`);
        } else {
          toast.success(`Found ${transportList.length} transport option(s)`);
        }
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to search transport');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (transportId) => {
    try {
      await api.post(`/transportation/${transportId}/book`);
      if (onSelectTransport) {
        onSelectTransport(results.find(t => t._id === transportId));
      }
    } catch (error) {
      console.error('Failed to track booking:', error);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Find Transport</h3>
        </div>
        
        {!expanded && (
          <button
            onClick={searchTransport}
            disabled={loading || !from || !to}
            className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        )}
      </div>

      {!from || !to ? (
        <p className="text-sm text-blue-700">
          Set "From" and "To" locations to search for transport options
        </p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <MapPin className="h-4 w-4" />
          <span>{from}</span>
          <span>→</span>
          <MapPin className="h-4 w-4" />
          <span>{to}</span>
        </div>
      )}

      {expanded && results && Array.isArray(results) && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          {results.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No transport available for this route</p>
              <p className="text-sm mt-1">Try using a taxi or private car</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {results.length} option{results.length > 1 ? 's' : ''} available
              </p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((transport) => {
                  const isNearby = transport.matchType === 'nearby-stops';
                  
                  return (
                    <div
                      key={transport._id}
                      className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium text-sm">{transport.name}</p>
                            <p className="text-xs text-gray-500">
                              {transport.operator?.name || transport.type}
                            </p>
                          </div>
                        </div>
                        
                        {transport.pricing?.amount && (
                          <span className="text-sm font-bold text-green-600">
                            {transport.pricing.currency} {transport.pricing.amount}
                          </span>
                        )}
                      </div>

                      {isNearby && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
                          <div className="flex items-start gap-1 text-xs text-orange-700">
                            <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <div>
                              <p>Walk {transport.distanceFromOrigin}km to {transport.nearestOriginStop.name}</p>
                              <p>Get off at {transport.nearestDestinationStop.name}, walk {transport.distanceFromDestination}km</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {transport.schedule?.departures && transport.schedule.departures.length > 0 && (
                        <div className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">Departures: </span>
                          {transport.schedule.departures.slice(0, 3).join(', ')}
                          {transport.schedule.departures.length > 3 && '...'}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {transport.booking?.onlineUrl && (
                          <a
                            href={transport.booking.onlineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleBook(transport._id)}
                            className="flex-1 btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Book
                          </a>
                        )}
                        
                        {transport.booking?.phoneNumbers && transport.booking.phoneNumbers[0] && (
                          <a
                            href={`tel:${transport.booking.phoneNumbers[0]}`}
                            className="flex-1 btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          <button
            onClick={() => setExpanded(false)}
            className="text-sm text-blue-600 hover:underline w-full text-center pt-2"
          >
            Hide Results
          </button>
        </div>
      )}
    </div>
  );
};

export default TransportSearchWidget;
