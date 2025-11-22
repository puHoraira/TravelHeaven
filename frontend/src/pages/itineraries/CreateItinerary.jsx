import {
  ArrowLeft, Calendar, MapPin, Plus,
  Save,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../../components/itinerary/MapView';
import LocationSearchInput from '../../components/LocationSearchInput';
import RailwaySearchWidget from '../../components/RailwaySearchWidget';
import api from '../../lib/api';
import './CreateItinerary.css';

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
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [currentEditingStop, setCurrentEditingStop] = useState({ dayIndex: null, stopIndex: null });

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

      const locData = Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [];
      const hotData = Array.isArray(hotRes.data) ? hotRes.data : hotRes.data?.data || [];
      const traData = Array.isArray(traRes.data) ? traRes.data : traRes.data?.data || [];

      setLocations(locData);
      setHotels(hotData);
      setTransports(traData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
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

    // If it's a custom stop, open the location search modal
    if (stopType === 'custom') {
      const stopIndex = newDays[dayIndex].stops.length - 1;
      setCurrentEditingStop({ dayIndex, stopIndex });
      setShowLocationSearch(true);
    }
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
          newDays[dayIndex].stops[stopIndex].coordinates = {
            lat: resource.coordinates.latitude ?? resource.coordinates.lat ?? 0,
            lng: resource.coordinates.longitude ?? resource.coordinates.lng ?? 0
          };
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

  // Handle location selection from LocationSearchInput
  const handleLocationSelect = (location) => {
    const { dayIndex, stopIndex } = currentEditingStop;
    
    if (dayIndex !== null && stopIndex !== null) {
      const newDays = [...days];
      newDays[dayIndex].stops[stopIndex].name = location.name;
      newDays[dayIndex].stops[stopIndex].customDescription = location.fullAddress;
      newDays[dayIndex].stops[stopIndex].coordinates = {
        lat: location.coordinates.latitude,
        lng: location.coordinates.longitude
      };
      setDays(newDays);
      
      toast.success('Location selected successfully!');
      setShowLocationSearch(false);
      setCurrentEditingStop({ dayIndex: null, stopIndex: null });
    }
  };

  const openLocationSearchForCustomStop = (dayIndex, stopIndex) => {
    setCurrentEditingStop({ dayIndex, stopIndex });
    setShowLocationSearch(true);
  };

  // Suggestion helpers (adds first approved hotel/transport for the day's first location)
  const getFirstLocationIdForDay = (dayIndex) => {
    const day = days[dayIndex];
    const loc = day?.stops?.find((s) => s.type === 'location' && s.referenceId);
    return loc?.referenceId || null;
  };

  const suggestHotelForDay = async (dayIndex) => {
    const locationId = getFirstLocationIdForDay(dayIndex);
    if (!locationId) {
      toast.error('Add a location to this day first.');
      return;
    }
    try {
      const res = await api.get('/hotels', { params: { locationId, limit: 1 } });
      const list = res.data || res;
      const hotel = Array.isArray(list) ? list[0] : list?.data?.[0];
      if (!hotel) {
        toast.error('No approved hotels found for that location.');
        return;
      }
      setDays(prev => {
        const copy = [...prev];
        const stop = {
          type: 'hotel',
          name: hotel.name,
          time: '',
          notes: '',
          referenceId: hotel._id,
          coordinates: hotel.coordinates || { lat: 0, lng: 0 },
          order: copy[dayIndex].stops.length,
        };
        copy[dayIndex] = { ...copy[dayIndex], stops: [...copy[dayIndex].stops, stop] };
        return copy;
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch hotel suggestions');
    }
  };

  const suggestTransportForDay = async (dayIndex) => {
    const locationId = getFirstLocationIdForDay(dayIndex);
    if (!locationId) {
      toast.error('Add a location to this day first.');
      return;
    }
    try {
      const res = await api.get('/transportation', { params: { locationId, limit: 1 } });
      const list = res.data || res;
      const item = Array.isArray(list) ? list[0] : list?.data?.[0];
      if (!item) {
        toast.error('No approved transport found for that location.');
        return;
      }
      setDays(prev => {
        const copy = [...prev];
        const stop = {
          type: 'transport',
          name: item.name,
          time: '',
          notes: '',
          referenceId: item._id,
          coordinates: item.coordinates || { lat: 0, lng: 0 },
          order: copy[dayIndex].stops.length,
        };
        copy[dayIndex] = { ...copy[dayIndex], stops: [...copy[dayIndex].stops, stop] };
        return copy;
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch transport suggestions');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const itineraryData = {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: data.isPublic,
        days: days.map((day, index) => ({
          dayNumber: index + 1,
          date: day.date,
          title: `Day ${index + 1}`,
          stops: day.stops
            .filter(s => s.name || s.referenceId) // Only include stops with data
            .map((stop, stopIndex) => {
              const stopData = {
                order: stopIndex,
                notes: stop.notes || '',
              };

              // Map based on stop type
              if (stop.type === 'location' && stop.referenceId) {
                stopData.locationId = stop.referenceId;
              } else if (stop.type === 'hotel' && stop.referenceId) {
                stopData.hotelId = stop.referenceId;
              } else if (stop.type === 'transport' && stop.referenceId) {
                stopData.transportId = stop.referenceId;
              } else if (stop.type === 'custom') {
                stopData.customName = stop.name;
                stopData.customDescription = stop.customDescription || stop.notes;
                if (stop.coordinates && (stop.coordinates.lat || stop.coordinates.lng)) {
                  stopData.customCoordinates = {
                    latitude: stop.coordinates.lat,
                    longitude: stop.coordinates.lng,
                  };
                }
              }

              return stopData;
            }),
        })),
      };

      // Add budget if provided
      if (data.budgetTotal > 0) {
        itineraryData.budget = {
          total: parseFloat(data.budgetTotal),
          currency: data.budgetCurrency,
          expenses: [],
        };
      }

      const response = await api.post('/itineraries', itineraryData);
      toast.success('Itinerary created successfully!');
      
      // Extract the ID from nested response structure
      const itineraryId = response.data?._id || response._id;
      if (itineraryId) {
        navigate(`/itineraries/${itineraryId}`);
      } else {
        navigate('/itineraries');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to create itinerary');
      console.error('Error creating itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gather all stops for map preview
  const allStops = days.flatMap(day => day.stops.filter(s => s.name));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Link to="/itineraries" className="back-link inline-flex items-center gap-2 mb-4">
        <ArrowLeft size={20} />
        Back to My Itineraries
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="card create-itinerary-card">
          <h1 className="create-itinerary-title text-3xl font-bold mb-6">Create New Itinerary</h1>
          
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
          <div className="card create-itinerary-card">
            <h2 className="section-header-red text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin />
              Trip Preview
            </h2>
            <div className="map-container">
              <MapView stops={allStops} showRoute={true} height={400} />
            </div>
          </div>
        )}

        {/* Days Planning */}
        {days.length > 0 && (
          <div className="card create-itinerary-card">
            <h2 className="section-header-red text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar />
              Plan Your Days ({days.length} days)
            </h2>

            <div className="space-y-6">
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="day-card border rounded-lg p-4">
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
                      <div key={stopIndex} className="stop-card rounded-lg p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="stop-number w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
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
                                  onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const items = stop.type === 'location' ? locations :
                                      stop.type === 'hotel' ? hotels :
                                        transports;
                                    const selectedItem = items.find(item => item._id === selectedId);

                                    updateStop(dayIndex, stopIndex, 'referenceId', selectedId);
                                    if (selectedItem) {
                                      updateStop(dayIndex, stopIndex, 'name', selectedItem.name);
                                      if (selectedItem.coordinates) {
                                        updateStop(dayIndex, stopIndex, 'coordinates', {
                                          lat: selectedItem.coordinates.latitude || selectedItem.coordinates.lat || 0,
                                          lng: selectedItem.coordinates.longitude || selectedItem.coordinates.lng || 0
                                        });
                                      }
                                    }
                                  }}
                                  className="input input-sm w-full"
                                >
                                  <option value="">Choose {stop.type}...</option>
                                  {(stop.type === 'location' ? locations :
                                    stop.type === 'hotel' ? hotels :
                                      transports).map(item => (
                                    <option key={item._id} value={item._id}>
                                      {item.name} {item.city ? `- ${item.city}` : ''}
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
                                  readOnly
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

                            {/* Custom Stop Location Display */}
                            {stop.type === 'custom' && (
                              <div className="md:col-span-2">
                                {stop.name ? (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900 mb-1">
                                          ✓ Location Selected
                                        </p>
                                        <p className="text-sm text-gray-900 font-medium">{stop.name}</p>
                                        {stop.customDescription && (
                                          <p className="text-xs text-gray-600 mt-1">{stop.customDescription}</p>
                                        )}
                                        {stop.coordinates && (stop.coordinates.lat || stop.coordinates.lng) && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            📍 {Number(stop.coordinates.lat).toFixed(6)}, {Number(stop.coordinates.lng).toFixed(6)}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openLocationSearchForCustomStop(dayIndex, stopIndex)}
                                        className="btn-secondary btn-sm flex items-center gap-1 flex-shrink-0"
                                      >
                                        <MapPin size={14} />
                                        Change
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-900 mb-2">
                                      📍 Click below to search and select a location
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => openLocationSearchForCustomStop(dayIndex, stopIndex)}
                                      className="btn-primary btn-sm flex items-center gap-2 w-full justify-center"
                                    >
                                      <MapPin size={14} />
                                      Search Location
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStop(dayIndex, stopIndex)}
                            className="remove-button hover:text-red-700 p-1 flex-shrink-0"
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
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Add Location</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'hotel')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Add Hotel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'transport')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Add Transport</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addStopToDay(dayIndex, 'custom')}
                      className="btn-secondary btn-sm flex items-center gap-1"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Add Custom Stop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => suggestHotelForDay(dayIndex)}
                      className="btn-secondary btn-sm flex items-center gap-1"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Suggest Hotel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => suggestTransportForDay(dayIndex)}
                      className="btn-secondary btn-sm flex items-center gap-1"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Plus size={14} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Suggest Transport</span>
                    </button>
                  </div>

                  {/* Railway Search Widget */}
                  {day.stops.length > 0 && (
                    <div className="mt-4">
                      <RailwaySearchWidget
                        from={day.stops.length > 0 ? day.stops[0]?.name : ''}
                        to={day.stops.length > 1 ? day.stops[day.stops.length - 1]?.name : ''}
                        date={day.date}
                        onSelectTrain={(train) => {
                          toast.success(`Selected: ${train.tripNumber}`);
                          // Optionally add train info to day notes or as a stop
                          console.log('Selected train:', train);
                        }}
                      />
                    </div>
                  )}
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

      {/* Location Search Modal */}
      {showLocationSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="location-modal bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="modal-header p-6 border-b flex justify-between items-center text-white rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">Search Location</h3>
                <p className="text-blue-100 text-sm mt-1">Find and select your destination</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLocationSearch(false);
                  setCurrentEditingStop({ dayIndex: null, stopIndex: null });
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Helpful Info Banner */}
              <div className="info-banner-blue rounded-lg p-4 mb-4">
                <p className="text-blue-900 font-semibold mb-2">💡 How to add a location:</p>
                <ol className="text-blue-800 space-y-1 ml-4 list-decimal text-sm">
                  <li>Type any place name (e.g., "Paris", "Eiffel Tower", "Central Park")</li>
                  <li>Wait for search results to appear below</li>
                  <li>Click on the location you want from the dropdown</li>
                  <li>The coordinates will be automatically fetched!</li>
                </ol>
                <p className="text-blue-700 mt-2 text-xs italic">
                  ✨ No need to know latitude/longitude - we handle that for you!
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Search Location
                </label>
                <LocationSearchInput
                  onLocationSelect={handleLocationSelect}
                  placeholder="Type a place name: Eiffel Tower, Times Square, etc..."
                />
              </div>

              {currentEditingStop.dayIndex !== null && currentEditingStop.stopIndex !== null && (
                (() => {
                  const stop = days[currentEditingStop.dayIndex]?.stops[currentEditingStop.stopIndex];
                  return stop?.coordinates?.lat && stop?.coordinates?.lng ? (
                    <div className="info-banner-green rounded-lg p-4">
                      <p className="text-green-900 font-semibold mb-2">✓ Location Selected Successfully!</p>
                      <p className="text-sm text-gray-900"><strong>{stop.name}</strong></p>
                      {stop.customDescription && (
                        <p className="text-xs text-gray-600 mt-1">{stop.customDescription}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        📍 Coordinates: {stop.coordinates.lat.toFixed(6)}, {stop.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  ) : null;
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}