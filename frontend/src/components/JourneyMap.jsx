import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Calendar, DollarSign } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different days
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
        justify-center;
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

/**
 * Auto-fit map bounds to show all markers
 */
const AutoFitBounds = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(pos => pos && pos[0] && pos[1]);
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [positions, map]);

  return null;
};

/**
 * Journey Map Component
 * Displays an interactive map with day-by-day journey visualization
 */
const JourneyMap = ({ days = [], activeDay = null, onMarkerClick }) => {
  const defaultCenter = [23.8103, 90.4125]; // Default: Dhaka
  const defaultZoom = 7;

  // Extract all coordinates from days
  const allPositions = [];
  const markers = [];
  const route = [];

  days.forEach((day, dayIndex) => {
    if (day.stops && day.stops.length > 0) {
      day.stops.forEach((stop, stopIndex) => {
        let lat, lng, name, description, type;

        // Check if it's a location with coordinates
        if (stop.locationId?.coordinates?.latitude && stop.locationId?.coordinates?.longitude) {
          lat = stop.locationId.coordinates.latitude;
          lng = stop.locationId.coordinates.longitude;
          name = stop.locationId.name;
          description = stop.locationId.description;
          type = 'location';
        }
        // Check if it's a hotel with coordinates
        else if (stop.hotelId?.coordinates?.latitude && stop.hotelId?.coordinates?.longitude) {
          lat = stop.hotelId.coordinates.latitude;
          lng = stop.hotelId.coordinates.longitude;
          name = stop.hotelId.name;
          description = stop.hotelId.description;
          type = 'hotel';
        }
        // Check for custom coordinates
        else if (stop.customCoordinates?.latitude && stop.customCoordinates?.longitude) {
          lat = stop.customCoordinates.latitude;
          lng = stop.customCoordinates.longitude;
          name = stop.customName || 'Custom Stop';
          description = stop.customDescription || stop.notes;
          type = 'custom';
        }

        if (lat && lng) {
          const position = [lat, lng];
          allPositions.push(position);
          route.push(position);
          
          markers.push({
            position,
            dayNumber: day.dayNumber,
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

  if (allPositions.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Journey Data Yet</h3>
          <p className="text-gray-500">Add stops with coordinates to see them on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg border-4 border-white">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Auto-fit bounds to show all markers */}
        <AutoFitBounds positions={allPositions} />

        {/* Route line connecting all stops */}
        {route.length > 1 && (
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
          const icon = isFirst 
            ? startMarker 
            : isLast 
              ? endMarker 
              : createDayMarker(marker.dayNumber, marker.isActive);

          return (
            <Marker
              key={`marker-${marker.dayIndex}-${marker.stopIndex}`}
              position={marker.position}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(marker.dayIndex, marker.stopIndex)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-64">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
                        Day {marker.dayNumber}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900">{marker.name}</h3>
                    </div>
                    <span className="text-2xl">
                      {marker.type === 'hotel' && '🏨'}
                      {marker.type === 'location' && '📍'}
                      {marker.type === 'custom' && '⭐'}
                    </span>
                  </div>

                  {marker.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {marker.description}
                    </p>
                  )}

                  {marker.day.date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar size={14} />
                      {new Date(marker.day.date).toLocaleDateString()}
                    </div>
                  )}

                  {marker.stop.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                      <strong>Note:</strong> {marker.stop.notes}
                    </div>
                  )}

                  {marker.stop.estimatedCost && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                      <DollarSign size={14} />
                      <span>Est. Cost: {marker.stop.estimatedCost}</span>
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
};

export default JourneyMap;
