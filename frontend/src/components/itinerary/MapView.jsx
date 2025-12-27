import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Calendar, Clock, DollarSign } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons with day numbers
const createDayMarker = (dayNumber, isActive = false) => {
  const color = isActive ? '#3B82F6' : '#8B5CF6';
  const size = isActive ? 40 : 35;
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${isActive ? '16px' : '14px'};
        cursor: pointer;
        transition: all 0.3s;
      ">
        ${dayNumber}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Start marker (green flag)
const startMarker = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #10B981;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    ">
      🚩
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// End marker (red flag)
const endMarker = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #EF4444;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    ">
      🏁
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Type-based icons for stops
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const stopTypeIcons = {
  location: createCustomIcon('#3b82f6'), // blue
  hotel: createCustomIcon('#10b981'), // green
  transport: createCustomIcon('#f59e0b'), // amber
  custom: createCustomIcon('#8b5cf6'), // purple
};

// Component to fit map bounds to markers
function FitBounds({ positions }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(
        (pos) => Array.isArray(pos)
          && pos.length === 2
          && Number.isFinite(pos[0])
          && Number.isFinite(pos[1])
      );
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [positions, map]);
  
  return null;
}

const readLatLng = (source) => {
  if (!source) return null;

  const latRaw = source.latitude ?? source.lat;
  const lngRaw = source.longitude ?? source.lng ?? source.lon;
  const lat = typeof latRaw === 'number' ? latRaw : parseFloat(latRaw);
  const lng = typeof lngRaw === 'number' ? lngRaw : parseFloat(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

/**
 * MapView Component - Interactive map display for itinerary stops
 * Design Pattern: Observer Pattern - Updates when stops data changes
 * Now supports both flat stops array and day-based itinerary structure
 * 
 * @param {Array} stops - Array of stop objects with coordinates (legacy)
 * @param {Array} days - Array of day objects with stops array (new feature)
 * @param {number} activeDay - Currently selected day index (highlights markers)
 * @param {Function} onMarkerClick - Callback when marker clicked (dayIndex, stopIndex)
 * @param {boolean} showRoute - Whether to draw lines connecting stops
 * @param {number} height - Map height in pixels
 */
export default function MapView({ 
  stops = [], 
  days = [],
  activeDay = null,
  onMarkerClick,
  showRoute = true, 
  height = 400 
}) {
  const defaultCenter = [23.8103, 90.4125]; // Default: Dhaka

  // Decide whether to use days or flat stops
  const useDayBased = days && days.length > 0;

  // Extract markers from day-based structure
  const allPositions = [];
  const markers = [];
  const route = [];

  if (useDayBased) {
    days.forEach((day, dayIndex) => {
      if (day.stops && day.stops.length > 0) {
        day.stops.forEach((stop, stopIndex) => {
          let lat, lng, name, description, type;

          // Check if it's a location with coordinates
          const locationCoords = readLatLng(stop.locationId?.coordinates);
          if (locationCoords) {
            lat = locationCoords.lat;
            lng = locationCoords.lng;
            name = stop.locationId.name;
            description = stop.locationId.description;
            type = 'location';
          }
          // Check if it's a hotel with coordinates
          else {
            const hotelCoords = readLatLng(stop.hotelId?.coordinates);
            if (hotelCoords) {
              lat = hotelCoords.lat;
              lng = hotelCoords.lng;
            name = stop.hotelId.name;
            description = stop.hotelId.description;
            type = 'hotel';
            } else {
              // Check for custom coordinates (supports latitude/longitude, lat/lng, lat/lon)
              const customCoords = readLatLng(stop.customCoordinates);
              if (customCoords) {
                lat = customCoords.lat;
                lng = customCoords.lng;
                name = stop.customName || stop.name || 'Custom Stop';
                description = stop.customDescription || stop.notes;
                type = stop.type || 'custom';
              } else {
                // Legacy coordinate format (lat/lng)
                const legacyCoords = readLatLng(stop.coordinates);
                if (legacyCoords) {
                  lat = legacyCoords.lat;
                  lng = legacyCoords.lng;
                  name = stop.name || stop.customName || 'Stop';
                  description = stop.notes;
                  type = stop.type || 'custom';
                }
              }
            }
          }

          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const position = [lat, lng];
            allPositions.push(position);
            route.push(position);
            
            markers.push({
              position,
              dayNumber: day.dayNumber || dayIndex + 1,
              dayIndex,
              stopIndex,
              name,
              description,
              type,
              day,
              stop,
              isActive: activeDay === dayIndex
            });
          }
        });
      }
    });
  } else {
    // Legacy flat stops array
    const validStops = stops.filter((stop) => Boolean(readLatLng(stop?.coordinates) || readLatLng(stop?.customCoordinates)));
    
    validStops.forEach((stop, index) => {
      const coords = readLatLng(stop.coordinates) || readLatLng(stop.customCoordinates);
      if (!coords) return;
      const position = [coords.lat, coords.lng];
      allPositions.push(position);
      route.push(position);
      
      markers.push({
        position,
        dayNumber: null,
        dayIndex: null,
        stopIndex: index,
        name: stop.name || 'Unnamed Stop',
        description: stop.notes,
        type: stop.type || 'custom',
        day: null,
        stop,
        isActive: false
      });
    });
  }

  if (allPositions.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No Journey Data Yet</p>
          <p className="text-gray-400 text-sm mt-2">Add stops with coordinates to visualize your journey on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border-4 border-white">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: `${height}px`, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Auto-fit bounds to show all markers */}
        <FitBounds positions={allPositions} />

        {/* Route line connecting all stops */}
        {showRoute && route.length > 1 && (
          <Polyline
            positions={route}
            color="#3B82F6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* Markers for each stop */}
        {markers.map((marker, index) => {
          const isFirst = index === 0;
          const isLast = index === markers.length - 1;
          
          // Use special icons for start/end, day markers for day-based, type icons for legacy
          const icon = useDayBased
            ? (isFirst 
                ? startMarker 
                : isLast 
                  ? endMarker 
                  : createDayMarker(marker.dayNumber, marker.isActive))
            : (stopTypeIcons[marker.type] || stopTypeIcons.custom);

          return (
            <Marker
              key={`marker-${marker.dayIndex}-${marker.stopIndex}-${index}`}
              position={marker.position}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && marker.dayIndex !== null && onMarkerClick(marker.dayIndex, marker.stopIndex)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-64">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {useDayBased && marker.dayNumber && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
                          Day {marker.dayNumber}
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-gray-900">{marker.name}</h3>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {marker.type === 'hotel' && '🏨 Hotel'}
                        {marker.type === 'location' && '📍 Location'}
                        {marker.type === 'transport' && '🚗 Transport'}
                        {marker.type === 'custom' && '⭐ Custom Stop'}
                      </p>
                    </div>
                  </div>

                  {marker.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {marker.description}
                    </p>
                  )}

                  {useDayBased && marker.day?.date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar size={14} />
                      {new Date(marker.day.date).toLocaleDateString()}
                    </div>
                  )}

                  {marker.stop?.time && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Clock size={14} />
                      {marker.stop.time}
                    </div>
                  )}

                  {marker.stop?.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                      <strong>Note:</strong> {marker.stop.notes}
                    </div>
                  )}

                  {marker.stop?.estimatedCost && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                      <DollarSign size={14} />
                      <span>Est. Cost: ${marker.stop.estimatedCost}</span>
                    </div>
                  )}

                  {!useDayBased && (
                    <div className="text-xs text-gray-400 mt-2">
                      Stop #{marker.stopIndex + 1}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
