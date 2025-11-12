import { MapPin, Clock, FileText, Trash2, Edit, Plus } from 'lucide-react';
import TransportSearchWidget from '../TransportSearchWidget';

/**
 * DayCard Component - Displays a single day in an itinerary
 * Design Pattern: Component Pattern (presentational component)
 * 
 * @param {Object} day - Day object with date and stops
 * @param {number} dayNumber - Day number in itinerary
 * @param {Function} onRemoveStop - Callback when stop is removed
 * @param {boolean} editable - Whether the day can be edited
 */
export default function DayCard({ day, dayNumber, onRemoveStop, onEditDay, onAddStop, editable = false }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStopTypeColor = (type) => {
    const colors = {
      location: 'bg-blue-100 text-blue-800',
      hotel: 'bg-green-100 text-green-800',
      transport: 'bg-amber-100 text-amber-800',
      custom: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || colors.custom;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            {/* Day number + title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                Day {dayNumber}
              </span>
              <h3 className="text-xl font-bold truncate">
                {day?.title || `Day ${dayNumber}`}
              </h3>
            </div>
            {/* Description (separate line) */}
            {day?.description && (
              <p className="text-blue-100 text-sm mt-1 line-clamp-1">
                {day.description}
              </p>
            )}
            {day.date && (
              <p className="text-blue-100 text-sm mt-1">{formatDate(day.date)}</p>
            )}
          </div>
          {editable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditDay?.(dayNumber - 1)}
                className="p-1.5 hover:bg-white/20 rounded"
                title="Edit day"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onAddStop?.(dayNumber - 1)}
                className="p-1.5 hover:bg-white/20 rounded"
                title="Add stop"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stops List */}
      <div className="p-4">
        {day.stops && day.stops.length > 0 ? (
          <div className="space-y-3">
            {day.stops.map((stop, index) => (
              <div
                key={stop._id || index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Stop Number Badge */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Stop Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900">{stop.name || 'Unnamed Stop'}</h4>
                    {editable && onRemoveStop && (
                      <button
                        onClick={() => onRemoveStop(dayNumber - 1, index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove stop"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Stop Type Badge */}
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStopTypeColor(stop.type)}`}>
                    {stop.type}
                  </span>

                  {/* Stop Time */}
                  {stop.time && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                      <Clock size={14} />
                      <span>{stop.time}</span>
                    </div>
                  )}

                  {/* Stop Location */}
                  {stop.coordinates && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin size={14} />
                      <span>
                        {stop.coordinates.lat.toFixed(4)}, {stop.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {/* Stop Notes */}
                  {stop.notes && (
                    <div className="flex items-start gap-1 text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                      <FileText size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{stop.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin size={48} className="mx-auto mb-2 opacity-30" />
            <p>No stops added for this day</p>
            {editable && (
              <div className="mt-2">
                <button
                  onClick={() => onAddStop?.(dayNumber - 1)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Stop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transport Suggestions */}
        {day.stops && day.stops.length >= 2 && (
          <div className="mt-4 pt-4 border-t">
            {(() => {
              const firstStop = day.stops[0];
              const lastStop = day.stops[day.stops.length - 1];
              
              // Try to get coordinates from locationId.coordinates or customCoordinates
              const fromCoords = firstStop?.locationId?.coordinates 
                ? [firstStop.locationId.coordinates.latitude, firstStop.locationId.coordinates.longitude]
                : firstStop?.customCoordinates 
                ? [firstStop.customCoordinates.latitude, firstStop.customCoordinates.longitude]
                : null;
                
              const toCoords = lastStop?.locationId?.coordinates
                ? [lastStop.locationId.coordinates.latitude, lastStop.locationId.coordinates.longitude]
                : lastStop?.customCoordinates
                ? [lastStop.customCoordinates.latitude, lastStop.customCoordinates.longitude]
                : null;
              
              console.log('🗺️ DayCard passing coordinates:', {
                from: firstStop?.locationId?.name || firstStop?.customName,
                fromCoords,
                fromLocation: firstStop?.locationId?.coordinates,
                fromCustom: firstStop?.customCoordinates,
                to: lastStop?.locationId?.name || lastStop?.customName,
                toCoords,
                toLocation: lastStop?.locationId?.coordinates,
                toCustom: lastStop?.customCoordinates
              });
              
              return (
                <TransportSearchWidget 
                  from={firstStop?.locationId?.name || firstStop?.customName || day.stops[0]?.name}
                  to={lastStop?.locationId?.name || lastStop?.customName || day.stops[day.stops.length - 1]?.name}
                  fromCoords={fromCoords}
                  toCoords={toCoords}
                />
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
