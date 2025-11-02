import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calendar, MapPin, Clock, DollarSign, FileText, GripVertical } from 'lucide-react';
import LocationSearchInput from '../LocationSearchInput';
import toast from 'react-hot-toast';

/**
 * AddDayModal Component
 * Comprehensive modal for adding/editing days with location search and geocoding
 * Design Patterns:
 * - Builder Pattern: Constructs complex day objects step by step
 * - Strategy Pattern: Different strategies for adding stops (search, manual, existing)
 */
export default function AddDayModal({ isOpen, onClose, onSave, existingDay = null, dayNumber }) {
  const [dayData, setDayData] = useState({
    dayNumber: dayNumber || 1,
    date: '',
    title: '',
    description: '',
    stops: []
  });

  const [currentStop, setCurrentStop] = useState({
    name: '',
    coordinates: { latitude: null, longitude: null },
    type: 'custom',
    time: '',
    notes: '',
    estimatedCost: ''
  });

  const [showAddStop, setShowAddStop] = useState(false);

  useEffect(() => {
    if (existingDay) {
      setDayData({
        dayNumber: existingDay.dayNumber || dayNumber || 1,
        date: existingDay.date ? new Date(existingDay.date).toISOString().split('T')[0] : '',
        title: existingDay.title || '',
        description: existingDay.description || '',
        stops: existingDay.stops || []
      });
    } else {
      setDayData({
        dayNumber: dayNumber || 1,
        date: '',
        title: '',
        description: '',
        stops: []
      });
    }
  }, [existingDay, dayNumber, isOpen]);

  const handleLocationSelect = (location) => {
    setCurrentStop({
      ...currentStop,
      name: location.name,
      customName: location.name,
      customDescription: location.fullAddress,
      customCoordinates: location.coordinates,
      coordinates: location.coordinates,
      type: 'custom'
    });
  };

  const handleAddStop = () => {
    if (!currentStop.name.trim()) {
      toast.error('Please enter a stop name or search for a location');
      return;
    }

    if (!currentStop.coordinates.latitude || !currentStop.coordinates.longitude) {
      toast.error('Please search and select a location from the dropdown');
      return;
    }

    const newStop = {
      ...currentStop,
      customName: currentStop.name,
      customCoordinates: currentStop.coordinates,
      order: dayData.stops.length + 1
    };

    setDayData({
      ...dayData,
      stops: [...dayData.stops, newStop]
    });

    // Reset current stop
    setCurrentStop({
      name: '',
      coordinates: { latitude: null, longitude: null },
      type: 'custom',
      time: '',
      notes: '',
      estimatedCost: ''
    });

    setShowAddStop(false);
    toast.success('Stop added!');
  };

  const handleRemoveStop = (index) => {
    const updatedStops = dayData.stops.filter((_, i) => i !== index);
    // Reorder remaining stops
    const reorderedStops = updatedStops.map((stop, i) => ({
      ...stop,
      order: i + 1
    }));
    
    setDayData({
      ...dayData,
      stops: reorderedStops
    });
    
    toast.success('Stop removed');
  };

  const handleSave = () => {
    if (!dayData.title.trim()) {
      toast.error('Please enter a day title');
      return;
    }

    if (!dayData.date) {
      toast.error('Please select a date');
      return;
    }

    if (dayData.stops.length === 0) {
      toast.error('Please add at least one stop');
      return;
    }

    onSave(dayData);
    onClose();
  };

  if (!isOpen) return null;

  const totalEstimatedCost = dayData.stops.reduce((sum, stop) => {
    const cost = parseFloat(stop.estimatedCost) || 0;
    return sum + cost;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {existingDay ? 'Edit Day' : `Add Day ${dayNumber}`}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Plan your activities and destinations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Day Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={dayData.date}
                onChange={(e) => setDayData({ ...dayData, date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Day Title *
              </label>
              <input
                type="text"
                value={dayData.title}
                onChange={(e) => setDayData({ ...dayData, title: e.target.value })}
                placeholder="e.g., Exploring Old Town"
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={dayData.description}
              onChange={(e) => setDayData({ ...dayData, description: e.target.value })}
              placeholder="Brief overview of the day's activities..."
              className="input"
              rows={2}
            />
          </div>

          {/* Stops List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-blue-600" size={20} />
                Stops ({dayData.stops.length})
              </h3>
              {!showAddStop && (
                <button
                  onClick={() => setShowAddStop(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Stop
                </button>
              )}
            </div>

            {/* Existing Stops */}
            {dayData.stops.length > 0 && (
              <div className="space-y-3 mb-4">
                {dayData.stops.map((stop, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {stop.name || stop.customName}
                        </h4>
                        
                        {stop.customDescription && (
                          <p className="text-sm text-gray-600 mb-2">
                            {stop.customDescription}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {stop.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {stop.time}
                            </span>
                          )}
                          {stop.estimatedCost && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign size={12} />
                              ${stop.estimatedCost}
                            </span>
                          )}
                          {stop.coordinates && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {stop.coordinates.latitude?.toFixed(4)}, {stop.coordinates.longitude?.toFixed(4)}
                            </span>
                          )}
                        </div>
                        
                        {stop.notes && (
                          <p className="text-sm text-gray-600 mt-2 bg-yellow-50 p-2 rounded">
                            📝 {stop.notes}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleRemoveStop(index)}
                        className="flex-shrink-0 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Stop Form */}
            {showAddStop && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Add New Stop</h4>
                  <button
                    onClick={() => {
                      setShowAddStop(false);
                      setCurrentStop({
                        name: '',
                        coordinates: { latitude: null, longitude: null },
                        type: 'custom',
                        time: '',
                        notes: '',
                        estimatedCost: ''
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Location Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="inline mr-1" />
                    Search Location *
                  </label>
                  
                  {/* Helpful Info Banner */}
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-3 text-sm">
                    <p className="text-blue-900 font-medium mb-1">💡 How to add a location:</p>
                    <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Type any place name (e.g., "Paris", "Eiffel Tower", "Central Park")</li>
                      <li>Wait for search results to appear below</li>
                      <li>Click on the location you want from the dropdown</li>
                      <li>The coordinates will be automatically fetched!</li>
                    </ol>
                    <p className="text-blue-700 mt-2 text-xs italic">
                      ✨ No need to know latitude/longitude - we handle that for you!
                    </p>
                  </div>
                  
                  <LocationSearchInput
                    onLocationSelect={handleLocationSelect}
                    placeholder="Type a place name: Eiffel Tower, Times Square, etc..."
                  />
                  
                  {currentStop.coordinates.latitude && (
                    <div className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="font-semibold mb-1">✓ Location Selected Successfully!</p>
                      <p className="text-xs">
                        <strong>{currentStop.name}</strong><br />
                        📍 Coordinates: {currentStop.coordinates.latitude.toFixed(6)}, {currentStop.coordinates.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock size={14} className="inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={currentStop.time}
                      onChange={(e) => setCurrentStop({ ...currentStop, time: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <DollarSign size={14} className="inline mr-1" />
                      Estimated Cost ($)
                    </label>
                    <input
                      type="number"
                      value={currentStop.estimatedCost}
                      onChange={(e) => setCurrentStop({ ...currentStop, estimatedCost: e.target.value })}
                      placeholder="0.00"
                      className="input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FileText size={14} className="inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    value={currentStop.notes}
                    onChange={(e) => setCurrentStop({ ...currentStop, notes: e.target.value })}
                    placeholder="Any special notes for this stop..."
                    className="input"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleAddStop}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add This Stop
                </button>
              </div>
            )}

            {/* Empty State */}
            {dayData.stops.length === 0 && !showAddStop && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">No stops added yet</p>
                <p className="text-sm text-gray-500">Click "Add Stop" to start planning your day</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {dayData.stops.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Day Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Stops</p>
                  <p className="text-2xl font-bold text-blue-600">{dayData.stops.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated Cost</p>
                  <p className="text-2xl font-bold text-green-600">${totalEstimatedCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dayData.date ? new Date(dayData.date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {existingDay ? 'Update Day' : 'Add Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
