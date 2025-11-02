import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * LocationSearchInput Component
 * Converts place names to coordinates using Nominatim (OpenStreetMap) geocoding service
 * Design Pattern: Adapter Pattern - Adapts geocoding API to app's coordinate format
 */
export default function LocationSearchInput({ onLocationSelect, placeholder = "Search for a place..." }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef(null);

  const handleSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    console.log('🔍 Searching for:', query);
    setSearching(true);
    
    try {
      // Using Nominatim (OpenStreetMap) free geocoding service
      const url = `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`;
      
      console.log('📡 Fetching:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TravelHeaven/1.0' // Required by Nominatim
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Results received:', data.length, 'locations');
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No results found for:', query);
        setSearchResults([]);
        setShowResults(true); // Show "no results" message
        setSearching(false);
        return;
      }
      
      // Transform results to our format
      const formattedResults = data.map(result => ({
        id: result.place_id,
        name: result.display_name.split(',')[0], // First part is the main name
        fullAddress: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        type: result.type,
        category: result.category,
        icon: getIconForType(result.type, result.category)
      }));

      console.log('✨ Formatted results:', formattedResults);
      setSearchResults(formattedResults);
      setShowResults(true);
      
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      toast.error(`Search failed: ${error.message}`);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  };

  const getIconForType = (type, category) => {
    // Map location types to emojis
    const iconMap = {
      // Accommodations
      hotel: '🏨',
      hostel: '🏨',
      motel: '🏨',
      guest_house: '🏠',
      
      // Attractions
      tourist_attraction: '🎭',
      museum: '🏛️',
      monument: '🗿',
      castle: '🏰',
      palace: '👑',
      park: '🌳',
      garden: '🌺',
      zoo: '🦁',
      aquarium: '🐠',
      beach: '🏖️',
      
      // Food
      restaurant: '🍽️',
      cafe: '☕',
      bar: '🍺',
      pub: '🍻',
      fast_food: '🍔',
      
      // Transport
      airport: '✈️',
      station: '🚂',
      bus_station: '🚌',
      ferry_terminal: '⛴️',
      
      // Places
      city: '🏙️',
      town: '🏘️',
      village: '🏡',
      country: '🌍',
      
      // Religious
      church: '⛪',
      mosque: '🕌',
      temple: '🛕',
      
      // Default
      default: '📍'
    };

    return iconMap[type] || iconMap[category] || iconMap.default;
  };

  const handleSelectLocation = (location) => {
    onLocationSelect({
      name: location.name,
      fullAddress: location.fullAddress,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      type: location.category || 'custom'
    });
    
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    toast.success(`Selected: ${location.name}`);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Clear results if query is too short
    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Set new timer for search
    debounceTimer.current = setTimeout(() => {
      handleSearch(value);
    }, 800); // Increased to 800ms for better debouncing
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="input pl-10 pr-10 w-full border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="text-blue-500 animate-spin" size={20} />
          </div>
        )}
        {!searching && searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
            title="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Searching indicator below input */}
      {searching && (
        <div className="mt-2 text-sm text-blue-600 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span>Searching for "{searchQuery}"...</span>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-[9999] w-full mt-2 bg-white rounded-lg shadow-2xl border-2 border-blue-300 max-h-80 overflow-y-auto">
          <div className="sticky top-0 bg-blue-50 px-4 py-2 border-b border-blue-200">
            <p className="text-xs font-semibold text-blue-900">
              ✨ {searchResults.length} location{searchResults.length > 1 ? 's' : ''} found - Click to select
            </p>
          </div>
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelectLocation(result)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors focus:bg-blue-100 focus:outline-none"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {result.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {result.fullAddress}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
        <div className="absolute z-[9999] w-full mt-2 bg-white rounded-lg shadow-2xl border-2 border-orange-300 p-4 text-center">
          <p className="text-orange-600 font-semibold">⚠️ No locations found</p>
          <p className="text-sm text-gray-500 mt-1">
            Try: "{searchQuery} city" or a nearby landmark
          </p>
        </div>
      )}
    </div>
  );
}
