import {
  AlertCircle,
  Bus,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  X,
  Mail,
  Clock,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';
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
  const [isClicked, setIsClicked] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportDetails, setTransportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const handleViewTransport = async (transportId) => {
    setSelectedTransport(transportId);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/transportation/${transportId}`);
      setTransportDetails(data);
    } catch (error) {
      console.error('Failed to load transport details:', error);
      toast.error('Failed to load transport details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedTransport(null);
    setTransportDetails(null);
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
            onClick={() => {
              setIsClicked(true);
              searchTransport();
              setTimeout(() => setIsClicked(false), 300);
            }}
            disabled={loading || !from || !to}
            className="btn btn-sm flex items-center gap-2"
            style={{ 
              backgroundColor: 'white',
              color: '#dc2626',
              border: '1.5px solid rgba(220, 38, 38, 0.3)'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#dc2626' }} />
                <span style={{ color: '#dc2626' }}>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" style={{ color: '#dc2626' }} />
                <span style={{ color: '#dc2626' }}>Search</span>
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
                      onClick={() => handleViewTransport(transport._id)}
                      className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Reversed Route Indicator */}
                      {transport.isReversed && (
                        <div className="mb-2 bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-700 flex items-center gap-1">
                          <span>🔄</span>
                          <span>Return route (originally {transport.originalRoute})</span>
                        </div>
                      )}

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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBook(transport._id);
                            }}
                            className="flex-1 btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Book
                          </a>
                        )}
                        
                        {transport.booking?.phoneNumbers && transport.booking.phoneNumbers[0] && (
                          <a
                            href={`tel:${transport.booking.phoneNumbers[0]}`}
                            onClick={(e) => e.stopPropagation()}
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
            className="text-sm hover:underline w-full text-center pt-2"
            style={{ color: '#dc2626' }}
          >
            Hide Results
          </button>
        </div>
      )}

      {/* Transport Details Modal */}
      {selectedTransport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : transportDetails ? (
              <div>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <Bus className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">{transportDetails.name}</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Transport Details */}
                <div className="px-6 pb-6 space-y-6">
                  {/* Type & Operator */}
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {transportDetails.type}
                    </div>
                    {transportDetails.operator?.name && (
                      <span className="text-gray-600">Operated by {transportDetails.operator.name}</span>
                    )}
                  </div>

                  {/* Route Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Route</h3>
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{transportDetails.route?.from?.name || 'Start'}</span>
                      <span>→</span>
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{transportDetails.route?.to?.name || 'Destination'}</span>
                    </div>
                    {transportDetails.route?.stops && transportDetails.route.stops.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Stops along the way:</p>
                        <div className="flex flex-wrap gap-2">
                          {transportDetails.route.stops.map((stop, idx) => (
                            <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                              {stop.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  {transportDetails.pricing && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-700">
                          {transportDetails.pricing.currency} {transportDetails.pricing.amount}
                        </span>
                        <span className="text-gray-600">per person</span>
                      </div>
                      {transportDetails.pricing.notes && (
                        <p className="text-sm text-gray-600 mt-2">{transportDetails.pricing.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Schedule */}
                  {transportDetails.schedule && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Schedule
                      </h3>
                      <div className="space-y-2">
                        {transportDetails.schedule.departures && transportDetails.schedule.departures.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Departure Times:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {transportDetails.schedule.departures.map((time, idx) => (
                                <span key={idx} className="bg-gray-100 px-3 py-1 rounded text-sm">
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {transportDetails.schedule.frequency && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Frequency:</span> {transportDetails.schedule.frequency}
                          </p>
                        )}
                        {transportDetails.schedule.duration && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Duration:</span> {transportDetails.schedule.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {transportDetails.amenities && transportDetails.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {transportDetails.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact & Booking */}
                  {transportDetails.booking && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Booking Information</h3>
                      <div className="space-y-3">
                        {transportDetails.booking.onlineUrl && (
                          <a
                            href={transportDetails.booking.onlineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Book Online</span>
                          </a>
                        )}
                        {transportDetails.booking.phoneNumbers && transportDetails.booking.phoneNumbers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Phone Numbers:</p>
                            {transportDetails.booking.phoneNumbers.map((phone, idx) => (
                              <a
                                key={idx}
                                href={`tel:${phone}`}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                              >
                                <Phone className="w-4 h-4" />
                                <span>{phone}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        {transportDetails.booking.email && (
                          <a
                            href={`mailto:${transportDetails.booking.email}`}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{transportDetails.booking.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {transportDetails.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
                      <p className="text-gray-700">{transportDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportSearchWidget;
