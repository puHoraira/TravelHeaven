import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons for different stop types
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
function FitBounds({ stops }) {
  const map = useMap();
  
  useEffect(() => {
    if (stops && stops.length > 0) {
      const bounds = stops
        .filter(stop => stop.coordinates?.lat && stop.coordinates?.lng)
        .map(stop => [stop.coordinates.lat, stop.coordinates.lng]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [stops, map]);
  
  return null;
}

/**
 * MapView Component - Interactive map display for itinerary stops
 * Design Pattern: Observer Pattern - Updates when stops data changes
 * 
 * @param {Array} stops - Array of stop objects with coordinates
 * @param {boolean} showRoute - Whether to draw lines connecting stops
 * @param {number} height - Map height in pixels
 */
export default function MapView({ stops = [], showRoute = true, height = 400 }) {
  // Get all stops with valid coordinates
  const validStops = stops.filter(
    stop => stop.coordinates?.lat && stop.coordinates?.lng
  );

  // Calculate route line coordinates
  const routeCoordinates = showRoute
    ? validStops.map(stop => [stop.coordinates.lat, stop.coordinates.lng])
    : [];

  // Default center (use first stop or fallback to world center)
  const center = validStops.length > 0
    ? [validStops[0].coordinates.lat, validStops[0].coordinates.lng]
    : [20, 0];

  if (validStops.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <p className="text-gray-500 text-lg">No stops with coordinates yet</p>
          <p className="text-gray-400 text-sm mt-2">Add stops to see them on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: `${height}px`, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route line connecting stops */}
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* Markers for each stop */}
        {validStops.map((stop, index) => (
          <Marker
            key={stop._id || index}
            position={[stop.coordinates.lat, stop.coordinates.lng]}
            icon={stopTypeIcons[stop.type] || stopTypeIcons.custom}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{stop.name || 'Unnamed Stop'}</h3>
                <p className="text-sm text-gray-600 capitalize">Type: {stop.type}</p>
                {stop.time && (
                  <p className="text-sm text-gray-600">Time: {stop.time}</p>
                )}
                {stop.notes && (
                  <p className="text-sm mt-2 text-gray-700">{stop.notes}</p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Stop #{index + 1}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds stops={validStops} />
      </MapContainer>
    </div>
  );
}
