import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, Calendar, MapPin, Plus, X, Save, DollarSign 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import MapView from '../../components/itinerary/MapView';

/**
 * CreateItinerary Page - Form to create new itinerary
 * Design Pattern: Builder Pattern - Step-by-step construction of itinerary
 */
export default function CreateItinerary() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      isPublic: false,
      budgetTotal: 0,
      budgetCurrency: 'USD',
    }
  });

  const [days, setDays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const [locRes, hotRes, traRes] = await Promise.all([
        api.get('/locations'),
        api.get('/hotels'),
        api.get('/transportation'),
      ]);
      setLocations(locRes.data.data || []);
      setHotels(hotRes.data.data || []);
      setTransports(traRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load resources');
      console.error(error);
    }
  };

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Calculate number of days and auto-generate day slots
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays > 0 && diffDays <= 30) {
        const newDays = Array.from({ length: diffDays }, (_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          return {
            date: date.toISOString(),
            stops: [],
          };
        });
        setDays(newDays);
      }
    }
  }, [startDate, endDate]);

  const addStopToDay = (dayIndex, stopType) => {
    const newDays = [...days];
    const newStop = {
      type: stopType,
      name: '',
      time: '',
      notes: '',
      coordinates: { lat: 0, lng: 0 },
      order: newDays[dayIndex].stops.length,
    };
    newDays[dayIndex].stops.push(newStop);
    setDays(newDays);
  };

  const updateStop = (dayIndex, stopIndex, field, value) => {
    const newDays = [...days];
    newDays[dayIndex].stops[stopIndex][field] = value;
    
    // If selecting from existing resource, auto-fill coordinates
    if (field === 'referenceId' && value) {
      const stop = newDays[dayIndex].stops[stopIndex];
      let resource;
      
      if (stop.type === 'location') {
        resource = locations.find(l => l._id === value);
      } else if (stop.type === 'hotel') {
        resource = hotels.find(h => h._id === value);
      } else if (stop.type === 'transport') {
        resource = transports.find(t => t._id === value);
      }
      
      if (resource) {
        newDays[dayIndex].stops[stopIndex].name = resource.name;
        if (resource.coordinates) {
          newDays[dayIndex].stops[stopIndex].coordinates = resource.coordinates;
        }
      }
    }
    
    setDays(newDays);
  };

  const removeStop = (dayIndex, stopIndex) => {
    const newDays = [...days];
    newDays[dayIndex].stops.splice(stopIndex, 1);
    // Reorder remaining stops
    newDays[dayIndex].stops.forEach((stop, idx) => {
      stop.order = idx;
    });
    setDays(newDays);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const itineraryData = {
        ...data,
        days: days.map(day => ({
          date: day.date,
          stops: day.stops.filter(s => s.name), // Only include stops with names
        })),
        budget: data.budgetTotal > 0 ? {
          total: parseFloat(data.budgetTotal),
          currency: data.budgetCurrency,
          expenses: [],
        } : undefined,
      };

      const response = await api.post('/itineraries', itineraryData);
      toast.success('Itinerary created successfully!');
      navigate(`/itineraries/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create itinerary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Gather all stops for map preview
  const allStops = days.flatMap(day => day.stops.filter(s => s.name));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Link to="/itineraries" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
        <ArrowLeft size={20} />
        Back to My Itineraries
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Itinerary</h1>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input"
                placeholder="e.g., Summer Europe Tour"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                {...register('description')}
                className="input"
                placeholder="Brief description of your trip"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="input"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                {...register('endDate', { required: 'End date is required' })}
                className="input"
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Total
              </label>
              <input
                type="number"
                {...register('budgetTotal')}
                className="input"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select {...register('budgetCurrency')} className="input">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isPublic')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Make this itinerary public (others can view)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        {allStops.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Trip Preview
            </h2>
            <MapView stops={allStops} showRoute={true} height={400} />
          </div>
        )}

        {/* Days Planning */}
        {days.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Plan Your Days ({days.length} days)
            </h2>

            <div className="space-y-6">
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Day {dayIndex + 1} - {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>

                  {/* Stops for this day */}
                  <div className="space-y-3 mb-3">
                    {day.stops.map((stop, stopIndex) => (
                      <div key={stopIndex} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {stopIndex + 1}
                          </div>
                          
                          <div className="flex-1 grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Stop Type
                              </label>
                              <select
                                value={stop.type}
                                onChange={(e) => updateStop(dayIndex, stopIndex, 'type', e.target.value)}
                                className="input input-sm"
                              >
                                <option value="location">Location</option>
                                <option value="hotel">Hotel</option>
                                <option value="transport">Transport</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            {stop.type !== 'custom' ? (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Select {stop.type}
                                </label>
                                <select
                                  value={stop.referenceId || ''}
                                  onChange={(e) => updateStop(dayIndex, stopIndex, 'referenceId', e.target.value)}
                                  className="input input-sm"
                                >
                                  <option value="">Choose...</option>
                                  {(stop.type === 'location' ? locations :
                                    stop.type === 'hotel' ? hotels :
                                    transports
                                  ).map(item => (
                                    <option key={item._id} value={item._id}>
                                      {item.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={stop.name}
                                  onChange={(e) => updateStop(dayIndex, stopIndex, 'name', e.target.value)}
                                  className="input input-sm"
                                  placeholder="Stop name"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Time
                              </label>
                              <input
                                type="time"
                                value={stop.time}
                                onChange={(e) => updateStop(dayIndex, stopIndex, 'time', e.target.value)}
                                className="input input-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Notes
                              </label>
                              <input
                                type="text"
                                value={stop.notes}
                                onChange={(e) => updateStop(dayIndex, stopIndex, 'notes', e.target.value)}
                                className="input input-sm"
                                placeholder="Optional notes"
                              />
                            </div>

                            {stop.type === 'custom' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Latitude
                                  </label>
                                  <input
                                    type="number"
                                    value={stop.coordinates.lat}
                                    onChange={(e) => updateStop(dayIndex, stopIndex, 'coordinates', {
                                      ...stop.coordinates,
                                      lat: parseFloat(e.target.value) || 0
                                    })}
                                    className="input input-sm"
                                    placeholder="0.0"
                                    step="0.000001"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Longitude
                                  </label>
                                  <input
                                    type="number"
                                    value={stop.coordinates.lng}
                                    onChange={(e) => updateStop(dayIndex, stopIndex, 'coordinates', {
                                      ...stop.coordinates,
                                      lng: parseFloat(e.target.value) || 0
                                    })}
                                    className="input input-sm"
                                    placeholder="0.0"
                                    step="0.000001"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStop(dayIndex, stopIndex)}
                            className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Stop Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'location')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Location
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'hotel')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Hotel
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'transport')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Transport
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'custom')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Custom Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link to="/itineraries" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? 'Creating...' : 'Create Itinerary'}
          </button>
        </div>
      </form>
    </div>
  );
}
