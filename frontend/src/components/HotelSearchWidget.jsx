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
  Users,
  X,
  Mail
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
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const handleViewHotel = async (hotelId) => {
    setSelectedHotel(hotelId);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/hotels/${hotelId}`);
      setHotelDetails(data);
    } catch (error) {
      console.error('Failed to load hotel details:', error);
      toast.error('Failed to load hotel details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedHotel(null);
    setHotelDetails(null);
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
                      onClick={() => handleViewHotel(hotel._id)}
                      className="bg-white p-3 rounded-lg border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md cursor-pointer"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(hotel._id);
                              }}
                              className="btn-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                            >
                              Select Hotel
                            </button>
                            
                            {hotel.contactInfo?.phone && (
                              <a
                                href={`tel:${hotel.contactInfo.phone}`}
                                onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => e.stopPropagation()}
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

      {/* Hotel Details Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : hotelDetails ? (
              <div>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900">{hotelDetails.name}</h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Hotel Images */}
                {hotelDetails.images && hotelDetails.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-6">
                    {hotelDetails.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={img.caption || hotelDetails.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Hotel Details */}
                <div className="px-6 pb-6 space-y-6">
                  {/* Rating & Location */}
                  <div className="flex items-center gap-4">
                    {hotelDetails.rating?.average > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{hotelDetails.rating.average.toFixed(1)}</span>
                        <span className="text-gray-500">({hotelDetails.rating.count} reviews)</span>
                      </div>
                    )}
                    {hotelDetails.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{hotelDetails.address.city}, {hotelDetails.address.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  {hotelDetails.priceRange && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-700">
                          {hotelDetails.priceRange.min} - {hotelDetails.priceRange.max} {hotelDetails.priceRange.currency}
                        </span>
                        <span className="text-gray-600">/night</span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {hotelDetails.description && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">About</h3>
                      <p className="text-gray-700">{hotelDetails.description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {hotelDetails.amenities && hotelDetails.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {hotelDetails.amenities.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rooms */}
                  {hotelDetails.rooms && hotelDetails.rooms.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Available Rooms</h3>
                      <div className="space-y-3">
                        {hotelDetails.rooms.map((room, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{room.roomType}</h4>
                                <p className="text-sm text-gray-600">{room.bedType} • Up to {room.capacity} guests</p>
                                {room.amenities && room.amenities.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">{room.amenities.join(', ')}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-green-600">
                                  {room.currency} {room.pricePerNight}
                                </p>
                                <p className="text-xs text-gray-500">/night</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {hotelDetails.contactInfo && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Contact</h3>
                      <div className="space-y-2">
                        {hotelDetails.contactInfo.phone && (
                          <a href={`tel:${hotelDetails.contactInfo.phone}`} className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                            <Phone className="w-4 h-4" />
                            <span>{hotelDetails.contactInfo.phone}</span>
                          </a>
                        )}
                        {hotelDetails.contactInfo.email && (
                          <a href={`mailto:${hotelDetails.contactInfo.email}`} className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                            <Mail className="w-4 h-4" />
                            <span>{hotelDetails.contactInfo.email}</span>
                          </a>
                        )}
                        {hotelDetails.contactInfo.website && (
                          <a href={hotelDetails.contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
                            <ExternalLink className="w-4 h-4" />
                            <span>Visit Website</span>
                          </a>
                        )}
                      </div>
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

export default HotelSearchWidget;
