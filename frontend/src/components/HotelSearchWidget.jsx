import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Hotel, 
  AlertCircle, 
  ExternalLink, 
  Phone, 
  Loader2,
  Navigation,
  Star,
  DollarSign,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

/**
 * Hotel Search Component for Itinerary Integration
 * Usage: <HotelSearchWidget locationName="Dhaka" coords={[lat,lng]} />
 */
const HotelSearchWidget = ({ locationName, coords, onSelectHotel }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const searchHotels = async () => {
    if (!locationName && !coords) {
      toast.error('Location information required');
      return;
    }

    setLoading(true);
    setExpanded(true);

    try {
      const params = {};
      
      if (coords && coords.length === 2) {
        // Use GPS coordinates for nearby search
        params.lat = coords[0];
        params.lng = coords[1];
        params.maxDistance = 5; // 5km radius
        console.log('🏨 Searching hotels by GPS:', params);
      } else if (locationName) {
        // Fallback to location name search
        params.locationName = locationName;
        console.log('🏨 Searching hotels by name:', params);
      }

      const { data } = await api.get('/hotels/find-nearby', { params });

      console.log('📦 Hotel API Response:', data);

      // Handle different response structures
      let hotelList = [];
      if (data.success && data.data) {
        hotelList = Array.isArray(data.data) ? data.data : data.data.hotels || [];
      } else if (Array.isArray(data)) {
        hotelList = data;
      }

      setResults(hotelList);
      
      if (hotelList.length === 0) {
        toast('No hotels found in this area', { icon: '🏨' });
      } else {
        toast.success(`Found ${hotelList.length} hotel(s)`);
      }
    } catch (error) {
      console.error('Hotel search error:', error);
      toast.error(error?.response?.data?.message || 'Failed to search hotels');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (hotelId) => {
    try {
      // Track hotel view/selection
      await api.post(`/hotels/${hotelId}/track-view`);
      if (onSelectHotel) {
        onSelectHotel(results.find(h => h._id === hotelId));
      }
    } catch (error) {
      console.error('Failed to track hotel selection:', error);
    }
  };

  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-800">
          <Hotel className="h-5 w-5" />
          <span className="font-semibold">Find Hotels</span>
        </div>
        
        <button
          onClick={searchHotels}
          disabled={loading}
          className="btn-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search Hotels
            </>
          )}
        </button>
      </div>

      {!locationName && !coords ? (
        <p className="text-sm text-purple-700">
          Set location to search for hotels
        </p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-purple-700">
          <MapPin className="h-4 w-4" />
          <span>{locationName || 'Current location'}</span>
          {coords && (
            <span className="text-xs text-purple-500">
              ({coords[0].toFixed(4)}, {coords[1].toFixed(4)})
            </span>
          )}
        </div>
      )}

      {expanded && results && Array.isArray(results) && (
        <div className="space-y-2 pt-2 border-t border-purple-200">
          {results.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No hotels available in this area</p>
              <p className="text-sm mt-1">Try searching a different location</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {results.length} hotel{results.length > 1 ? 's' : ''} available
              </p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((hotel) => {
                  const distance = hotel.distance || hotel.distanceKm || 0;
                  
                  return (
                    <div
                      key={hotel._id}
                      className="bg-white p-3 rounded-lg border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md"
                    >
                      <div className="flex gap-3">
                        {/* Hotel Image */}
                        {hotel.images?.[0]?.url ? (
                          <img 
                            src={hotel.images[0].url} 
                            alt={hotel.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-purple-100 rounded flex items-center justify-center">
                            <Hotel className="w-8 h-8 text-purple-400" />
                          </div>
                        )}

                        {/* Hotel Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 line-clamp-1">
                                {hotel.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {hotel.rating?.average > 0 && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{hotel.rating.average.toFixed(1)}</span>
                                    <span className="text-gray-500">({hotel.rating.count})</span>
                                  </div>
                                )}
                                {distance > 0 && (
                                  <span className="text-xs text-gray-500">
                                    • {distance.toFixed(1)}km away
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price Range */}
                          {hotel.priceRange && (
                            <div className="flex items-center gap-2 mt-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-700">
                                {hotel.priceRange.min} - {hotel.priceRange.max} {hotel.priceRange.currency}
                              </span>
                              <span className="text-xs text-gray-500">/night</span>
                            </div>
                          )}

                          {/* Amenities Preview */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {hotel.amenities.length > 4 && (
                                <span className="text-xs text-gray-500">
                                  +{hotel.amenities.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Room Count */}
                          {hotel.rooms && hotel.rooms.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                              <Users className="w-3 h-3" />
                              <span>{hotel.rooms.length} room types available</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleSelect(hotel._id)}
                              className="btn-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                            >
                              Select Hotel
                            </button>
                            
                            {hotel.contactInfo?.phone && (
                              <a
                                href={`tel:${hotel.contactInfo.phone}`}
                                className="btn-sm border border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                Call
                              </a>
                            )}
                            
                            {hotel.contactInfo?.website && (
                              <a
                                href={hotel.contactInfo.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-sm border border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hide Results Button */}
              <button
                onClick={() => setExpanded(false)}
                className="w-full text-center text-sm text-purple-600 hover:text-purple-700 py-2"
              >
                Hide Results
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HotelSearchWidget;
