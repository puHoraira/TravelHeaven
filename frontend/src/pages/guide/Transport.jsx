import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getImageUrlFromMixed } from '../../lib/media';
import { 
  MapPin, Plus, Trash2, X, Eye, Edit2, Bus, Camera, Info, Navigation,
  Building2, DollarSign, Clock, Star, Phone, ExternalLink
} from 'lucide-react';
import api from '../../lib/api';
import LocationSearchInput from '../../components/LocationSearchInput';

const GuideTransport = () => {
  const [myTransports, setMyTransports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingTransport, setViewingTransport] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'bus',
    description: '',
    locationId: '',
    images: [],
    // New route fields
    fromLocation: null,
    toLocation: null,
    stops: [],
    operator: {
      name: '',
      type: 'private',
      verified: false
    },
    pricing: {
      amount: '',
      currency: 'BDT',
      classes: []
    },
    schedule: {
      departures: [],
      frequency: ''
    },
    booking: {
      onlineUrl: '',
      phoneNumbers: [],
      counterLocations: []
    },
    facilities: []
  });
  
  const [newStop, setNewStop] = useState(null);
  const [newDeparture, setNewDeparture] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPriceClass, setNewPriceClass] = useState({ name: '', price: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, lRes] = await Promise.all([
        api.get('/transportation/my-transport'),
        api.get('/locations'),
      ]);
      setMyTransports(tRes.data || tRes.data?.data || []);
      setLocations(lRes.data || lRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setForm(prev => ({ ...prev, images: files }));
    } else if (name.includes('.')) {
      // Handle nested fields like operator.name
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleLocationSelect = (type, location) => {
    console.log(`Selected ${type}:`, location);
    if (type === 'from') {
      setForm(prev => ({ ...prev, fromLocation: location }));
    } else if (type === 'to') {
      setForm(prev => ({ ...prev, toLocation: location }));
    } else if (type === 'stop') {
      setNewStop(location);
    }
  };
  
  const addStop = () => {
    if (!newStop) {
      toast.error('Please select a stop location');
      return;
    }
    setForm(prev => ({
      ...prev,
      stops: [...prev.stops, { ...newStop, stopOrder: prev.stops.length + 1 }]
    }));
    setNewStop(null);
    toast.success('Stop added');
  };
  
  const removeStop = (index) => {
    setForm(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, stopOrder: i + 1 }))
    }));
  };
  
  const addDeparture = () => {
    if (!newDeparture.trim()) return;
    setForm(prev => ({
      ...prev,
      schedule: { ...prev.schedule, departures: [...prev.schedule.departures, newDeparture] }
    }));
    setNewDeparture('');
  };
  
  const removeDeparture = (index) => {
    setForm(prev => ({
      ...prev,
      schedule: { ...prev.schedule, departures: prev.schedule.departures.filter((_, i) => i !== index) }
    }));
  };
  
  const addPhone = () => {
    if (!newPhone.trim()) return;
    setForm(prev => ({
      ...prev,
      booking: { ...prev.booking, phoneNumbers: [...prev.booking.phoneNumbers, newPhone] }
    }));
    setNewPhone('');
  };
  
  const removePhone = (index) => {
    setForm(prev => ({
      ...prev,
      booking: { ...prev.booking, phoneNumbers: prev.booking.phoneNumbers.filter((_, i) => i !== index) }
    }));
  };
  
  const addPriceClass = () => {
    if (!newPriceClass.name || !newPriceClass.price) {
      toast.error('Please enter class name and price');
      return;
    }
    setForm(prev => ({
      ...prev,
      pricing: { 
        ...prev.pricing, 
        classes: [...prev.pricing.classes, { ...newPriceClass, price: Number(newPriceClass.price) }] 
      }
    }));
    setNewPriceClass({ name: '', price: '' });
  };
  
  const removePriceClass = (index) => {
    setForm(prev => ({
      ...prev,
      pricing: { ...prev.pricing, classes: prev.pricing.classes.filter((_, i) => i !== index) }
    }));
  };
  
  const toggleFacility = (facility) => {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const getImageUrl = (image) => {
    return getImageUrlFromMixed(image);
  };

  const submitTransport = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.type) {
      toast.error('Name and Type are required');
      return;
    }
    
    if (!form.fromLocation || !form.toLocation) {
      toast.error('Please select both From and To locations');
      return;
    }
    
    setLoading(true);
    try {
      const fd = new FormData();
      
      // Basic info
      fd.append('name', form.name);
      fd.append('type', form.type);
      if (form.description) fd.append('description', form.description);
      if (form.locationId) fd.append('locationId', form.locationId);
      
      // Route with GPS coordinates
      const routeData = {
        from: {
          name: form.fromLocation.name,
          address: form.fromLocation.fullAddress,
          location: {
            type: 'Point',
            coordinates: [form.fromLocation.coordinates.longitude, form.fromLocation.coordinates.latitude]
          }
        },
        to: {
          name: form.toLocation.name,
          address: form.toLocation.fullAddress,
          location: {
            type: 'Point',
            coordinates: [form.toLocation.coordinates.longitude, form.toLocation.coordinates.latitude]
          }
        },
        stops: form.stops.map(stop => ({
          name: stop.name,
          address: stop.fullAddress,
          location: {
            type: 'Point',
            coordinates: [stop.coordinates.longitude, stop.coordinates.latitude]
          },
          stopOrder: stop.stopOrder
        }))
      };
      fd.append('route', JSON.stringify(routeData));
      
      // Operator
      if (form.operator.name) {
        fd.append('operator', JSON.stringify(form.operator));
      }
      
      // Pricing
      if (form.pricing.amount || form.pricing.classes.length > 0) {
        fd.append('pricing', JSON.stringify({
          amount: Number(form.pricing.amount) || 0,
          currency: form.pricing.currency,
          classes: form.pricing.classes
        }));
      }
      
      // Schedule
      if (form.schedule.departures.length > 0 || form.schedule.frequency) {
        fd.append('schedule', JSON.stringify(form.schedule));
      }
      
      // Booking
      if (form.booking.onlineUrl || form.booking.phoneNumbers.length > 0) {
        fd.append('booking', JSON.stringify(form.booking));
      }
      
      // Facilities
      if (form.facilities.length > 0) {
        fd.append('facilities', JSON.stringify(form.facilities));
      }
      
      // Images
      if (form.images && form.images.length) {
        Array.from(form.images).forEach((file) => fd.append('images', file));
      }
      
      await api.post('/transportation', fd);
      toast.success('Transport submitted for approval');
      
      // Reset form
      setForm({
        name: '',
        type: 'bus',
        description: '',
        locationId: '',
        images: [],
        fromLocation: null,
        toLocation: null,
        stops: [],
        operator: { name: '', type: 'private', verified: false },
        pricing: { amount: '', currency: 'BDT', classes: [] },
        schedule: { departures: [], frequency: '' },
        booking: { onlineUrl: '', phoneNumbers: [], counterLocations: [] },
        facilities: []
      });
      
      await loadData();
    } catch (err) {
      console.error('Full error:', err);
      console.error('Response data:', err?.response?.data);
      
      // Show validation errors if available
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        console.error('Validation errors:', err.response.data.errors);
        err.response.data.errors.forEach(error => {
          console.error('Error detail:', error);
          toast.error(`${error.field || 'Field'}: ${error.message || error.msg}`);
        });
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create transport');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTransport = async (id) => {
    const ok = window.confirm('Delete this transport? This cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/transportation/${id}`);
      setMyTransports(prev => prev.filter(t => t._id !== id));
      toast.success('Transport deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete');
    }
  };
  
  const viewTransport = (transport) => {
    setViewingTransport(transport);
  };
  
  const editTransport = (transport) => {
    // Populate form with existing data
    setForm({
      name: transport.name || '',
      type: transport.type || 'bus',
      description: transport.description || '',
      locationId: transport.locationId?._id || '',
      images: [],
      fromLocation: transport.route?.from ? {
        name: transport.route.from.name,
        fullAddress: transport.route.from.address,
        coordinates: {
          latitude: transport.route.from.location?.coordinates?.[1],
          longitude: transport.route.from.location?.coordinates?.[0]
        }
      } : null,
      toLocation: transport.route?.to ? {
        name: transport.route.to.name,
        fullAddress: transport.route.to.address,
        coordinates: {
          latitude: transport.route.to.location?.coordinates?.[1],
          longitude: transport.route.to.location?.coordinates?.[0]
        }
      } : null,
      stops: transport.route?.stops?.map(stop => ({
        name: stop.name,
        fullAddress: stop.address,
        coordinates: {
          latitude: stop.location?.coordinates?.[1],
          longitude: stop.location?.coordinates?.[0]
        },
        stopOrder: stop.stopOrder
      })) || [],
      operator: transport.operator || { name: '', type: 'private', verified: false },
      pricing: transport.pricing || { amount: '', currency: 'BDT', classes: [] },
      schedule: transport.schedule || { departures: [], frequency: '' },
      booking: transport.booking || { onlineUrl: '', phoneNumbers: [], counterLocations: [] },
      facilities: transport.facilities || []
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Editing transport - Update and resubmit');
  };

  const statusBadge = (status) => {
    const map = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Create Transport</h1>
        <form onSubmit={submitTransport} className="space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Transport Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Shohoz AC Bus - Dhaka to Cox's Bazar"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select name="type" value={form.type} onChange={handleChange} className="input" required>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="taxi">Taxi/Cab</option>
                  <option value="rental-car">Rental Car</option>
                  <option value="flight">Flight</option>
                  <option value="boat">Boat</option>
                  <option value="launch">Launch</option>
                  <option value="cng">CNG</option>
                  <option value="rickshaw">Rickshaw</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="Describe the transport service, comfort level, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Associate with Location (Optional)</label>
              <select
                name="locationId"
                value={form.locationId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a location...</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Link this transport to a specific location in your listings</p>
            </div>
          </div>

          {/* Route Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Route Configuration
            </h3>
            
            {/* From Location */}
            <div>
              <label className="block text-sm font-medium mb-2">From Location *</label>
              <LocationSearchInput
                onLocationSelect={(location) => handleLocationSelect('from', location)}
                placeholder="Search starting location (e.g., Dhaka)"
              />
              {form.fromLocation && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">{form.fromLocation.name}</p>
                    <p className="text-xs text-green-600">{form.fromLocation.fullAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {form.fromLocation.coordinates.latitude.toFixed(4)}, {form.fromLocation.coordinates.longitude.toFixed(4)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, fromLocation: null }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* To Location */}
            <div>
              <label className="block text-sm font-medium mb-2">To Location *</label>
              <LocationSearchInput
                onLocationSelect={(location) => handleLocationSelect('to', location)}
                placeholder="Search destination (e.g., Cox's Bazar)"
              />
              {form.toLocation && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">{form.toLocation.name}</p>
                    <p className="text-xs text-blue-600">{form.toLocation.fullAddress}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {form.toLocation.coordinates.latitude.toFixed(4)}, {form.toLocation.coordinates.longitude.toFixed(4)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, toLocation: null }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Stops */}
            <div>
              <label className="block text-sm font-medium mb-2">Stops (Optional)</label>
              <div className="space-y-2">
                <LocationSearchInput
                  onLocationSelect={(location) => handleLocationSelect('stop', location)}
                  placeholder="Add intermediate stops (e.g., Chittagong)"
                />
                {newStop && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">{newStop.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={addStop}
                      className="btn-primary btn-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {form.stops.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Added Stops:</p>
                  {form.stops.map((stop, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 border rounded flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-500 mt-1">#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{stop.name}</p>
                          <p className="text-xs text-gray-500">{stop.fullAddress}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStop(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Operator Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Operator Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Operator Name</label>
                <input
                  name="operator.name"
                  value={form.operator.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Shohoz, Ena Paribahan, BRTC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operator Type</label>
                <select name="operator.type" value={form.operator.type} onChange={handleChange} className="input">
                  <option value="private">Private</option>
                  <option value="government">Government</option>
                  <option value="cooperative">Cooperative</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Pricing</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (BDT)</label>
                <input
                  name="pricing.amount"
                  type="number"
                  value={form.pricing.amount}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., 1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select name="pricing.currency" value={form.pricing.currency} onChange={handleChange} className="input">
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            
            {/* Price Classes */}
            <div>
              <label className="block text-sm font-medium mb-2">Price Classes (e.g., AC, Non-AC)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPriceClass.name}
                  onChange={(e) => setNewPriceClass(prev => ({ ...prev, name: e.target.value }))}
                  className="input flex-1"
                  placeholder="Class name (e.g., AC)"
                />
                <input
                  type="number"
                  value={newPriceClass.price}
                  onChange={(e) => setNewPriceClass(prev => ({ ...prev, price: e.target.value }))}
                  className="input w-32"
                  placeholder="Price"
                />
                <button type="button" onClick={addPriceClass} className="btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.pricing.classes.length > 0 && (
                <div className="space-y-1">
                  {form.pricing.classes.map((cls, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{cls.name}: {cls.price} {form.pricing.currency}</span>
                      <button type="button" onClick={() => removePriceClass(idx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Schedule</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Departure Times</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newDeparture}
                  onChange={(e) => setNewDeparture(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., 7:00 AM, 9:00 AM"
                />
                <button type="button" onClick={addDeparture} className="btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.schedule.departures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.schedule.departures.map((time, idx) => (
                    <div key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                      <span>{time}</span>
                      <button type="button" onClick={() => removeDeparture(idx)} className="text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <input
                name="schedule.frequency"
                value={form.schedule.frequency}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Every 30 minutes, Hourly, Daily"
              />
            </div>
          </div>

          {/* Booking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Booking Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Online Booking URL</label>
              <input
                name="booking.onlineUrl"
                type="url"
                value={form.booking.onlineUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://shohoz.com/..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone Numbers</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., 09613-102030"
                />
                <button type="button" onClick={addPhone} className="btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.booking.phoneNumbers.length > 0 && (
                <div className="space-y-1">
                  {form.booking.phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{phone}</span>
                      <button type="button" onClick={() => removePhone(idx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Facilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['ac', 'wifi', 'toilet', 'charging', 'blanket', 'water', 'snacks', 'tv', 'reclining-seat'].map(facility => (
                <label key={facility} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.facilities.includes(facility)}
                    onChange={() => toggleFacility(facility)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{facility.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Images</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Images</label>
              <input name="images" type="file" multiple accept="image/*" onChange={handleChange} className="input" />
              <p className="text-xs text-gray-500 mt-1">Upload photos of the transport vehicle</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t">
            <button type="submit" className="btn-primary px-8" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Transportation</h2>
          <span className="text-sm text-gray-600">{myTransports.length} total</span>
        </div>
        {myTransports.length === 0 ? (
          <p className="text-gray-600">No transport yet. Create one above.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTransports.map(t => (
              <div key={t._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {t.images?.[0] ? (
                  <img src={getImageUrl(t.images[0])} alt={t.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-gray-400">
                    <MapPin className="w-12 h-12 text-blue-300" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{t.name}</h3>
                    {statusBadge(t.approvalStatus)}
                  </div>
                  
                  {/* Route Display */}
                  {t.route?.from && t.route?.to && (
                    <div className="space-y-1.5 text-sm bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 font-medium">{t.route.from.name}</span>
                      </div>
                      {t.route.stops && t.route.stops.length > 0 && (
                        <div className="pl-3 border-l-2 border-dashed border-gray-300 ml-1 space-y-1">
                          {t.route.stops.slice(0, 2).map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <span>{stop.name}</span>
                            </div>
                          ))}
                          {t.route.stops.length > 2 && (
                            <div className="text-xs text-gray-400 pl-3">
                              +{t.route.stops.length - 2} more stops
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700 font-medium">{t.route.to.name}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">{t.type}</span>
                    {t.operator?.name && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{t.operator.name}</span>
                    )}
                    {t.pricing?.amount && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                        {t.pricing.amount} {t.pricing.currency || 'BDT'}
                      </span>
                    )}
                  </div>
                  
                  {t.facilities && t.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.facilities.slice(0, 3).map((facility, idx) => (
                        <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {facility}
                        </span>
                      ))}
                      {t.facilities.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          +{t.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
                  
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      {t.viewCount || 0} views • {t.bookingCount || 0} bookings
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => viewTransport(t)} 
                        className="btn-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button 
                        onClick={() => editTransport(t)} 
                        className="btn-sm bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteTransport(t._id)} 
                        className="btn-danger btn-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* View Transport Modal */}
      {viewingTransport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingTransport(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">{viewingTransport.name}</h2>
                  <p className="text-sm text-blue-100 capitalize">{viewingTransport.type} Service</p>
                </div>
              </div>
              <button onClick={() => setViewingTransport(null)} className="text-white hover:text-blue-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-l-4 ${
                viewingTransport.approvalStatus === 'approved' ? 'bg-green-50 border-green-500' :
                viewingTransport.approvalStatus === 'pending' ? 'bg-yellow-50 border-yellow-500' :
                'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Status: {statusBadge(viewingTransport.approvalStatus)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {viewingTransport.viewCount || 0} views • {viewingTransport.bookingCount || 0} bookings
                    </p>
                  </div>
                  {viewingTransport.approvalStatus === 'approved' && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Transport ID</p>
                      <p className="text-sm font-mono">{viewingTransport._id?.slice(-8)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Gallery */}
              {viewingTransport.images && viewingTransport.images.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Vehicle Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingTransport.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img.url} 
                          alt={img.caption || `Photo ${idx + 1}`} 
                          className="w-full h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow" 
                        />
                        {img.caption && (
                          <p className="text-xs text-gray-600 mt-1 truncate">{img.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              {viewingTransport.description && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{viewingTransport.description}</p>
                </div>
              )}
              
              {/* Route Information - ENHANCED */}
              {viewingTransport.route && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-5 border border-green-200">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Route & Stops
                  </h3>
                  
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    {/* Origin */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full border-4 border-green-200"></div>
                        <div className="w-0.5 h-full bg-green-200"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">START</span>
                          <span className="text-sm text-gray-500">Origin</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">{viewingTransport.route.from?.name}</p>
                        {viewingTransport.route.from?.address && (
                          <p className="text-sm text-gray-600 mt-1">{viewingTransport.route.from.address}</p>
                        )}
                        {viewingTransport.route.from?.location?.coordinates && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Navigation className="w-3 h-3" />
                            <span className="font-mono">
                              {viewingTransport.route.from.location.coordinates[1]?.toFixed(6)}, 
                              {viewingTransport.route.from.location.coordinates[0]?.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Intermediate Stops */}
                    {viewingTransport.route.stops && viewingTransport.route.stops.length > 0 && (
                      <div className="pl-2">
                        <div className="border-l-2 border-dashed border-gray-300 space-y-4 pl-6">
                          {viewingTransport.route.stops.map((stop, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[1.6rem] top-2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow-sm"></div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                    STOP {idx + 1}
                                  </span>
                                  {stop.duration && (
                                    <span className="text-xs text-gray-500">• {stop.duration} min stop</span>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900">{stop.name}</p>
                                {stop.address && (
                                  <p className="text-sm text-gray-600 mt-1">{stop.address}</p>
                                )}
                                {stop.location?.coordinates && (
                                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <Navigation className="w-3 h-3" />
                                    <span className="font-mono">
                                      {stop.location.coordinates[1]?.toFixed(6)}, 
                                      {stop.location.coordinates[0]?.toFixed(6)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Destination */}
                    <div className="flex items-start gap-4 pt-2">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full border-4 border-red-200"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">END</span>
                          <span className="text-sm text-gray-500">Destination</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">{viewingTransport.route.to?.name}</p>
                        {viewingTransport.route.to?.address && (
                          <p className="text-sm text-gray-600 mt-1">{viewingTransport.route.to.address}</p>
                        )}
                        {viewingTransport.route.to?.location?.coordinates && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Navigation className="w-3 h-3" />
                            <span className="font-mono">
                              {viewingTransport.route.to.location.coordinates[1]?.toFixed(6)}, 
                              {viewingTransport.route.to.location.coordinates[0]?.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Route Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600 text-xs">Total Stops</p>
                        <p className="font-semibold text-lg">{(viewingTransport.route.stops?.length || 0) + 2}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600 text-xs">Intermediate Stops</p>
                        <p className="font-semibold text-lg">{viewingTransport.route.stops?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Operator */}
              {viewingTransport.operator?.name && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    Operator Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Company Name</p>
                      <p className="font-medium">{viewingTransport.operator.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Type</p>
                      <p className="font-medium capitalize">{viewingTransport.operator.type}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pricing */}
              {(viewingTransport.pricing?.amount || viewingTransport.pricing?.classes?.length > 0) && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Pricing Information
                  </h3>
                  <div className="space-y-3">
                    {viewingTransport.pricing.amount && (
                      <div className="bg-white rounded p-3 border border-green-100">
                        <p className="text-gray-600 text-xs">Base Fare</p>
                        <p className="font-bold text-xl text-green-600">
                          {viewingTransport.pricing.amount} <span className="text-sm">{viewingTransport.pricing.currency || 'BDT'}</span>
                        </p>
                      </div>
                    )}
                    {viewingTransport.pricing.classes && viewingTransport.pricing.classes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Available Classes</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewingTransport.pricing.classes.map((cls, idx) => (
                            <div key={idx} className="bg-white border border-green-200 rounded-lg p-2">
                              <p className="text-xs text-gray-600">{cls.name}</p>
                              <p className="font-semibold text-green-700">{cls.price} {viewingTransport.pricing.currency || 'BDT'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Schedule */}
              {(viewingTransport.schedule?.departures?.length > 0 || viewingTransport.schedule?.frequency) && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Schedule & Timings
                  </h3>
                  <div className="space-y-3">
                    {viewingTransport.schedule.departures && viewingTransport.schedule.departures.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Departure Times</p>
                        <div className="grid grid-cols-4 gap-2">
                          {viewingTransport.schedule.departures.map((time, idx) => (
                            <div key={idx} className="bg-white border border-orange-200 rounded px-3 py-2 text-center">
                              <Clock className="w-3 h-3 mx-auto mb-1 text-orange-500" />
                              <span className="text-sm font-semibold">{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingTransport.schedule.frequency && (
                      <div className="bg-white rounded p-3 border border-orange-100">
                        <p className="text-gray-600 text-xs">Service Frequency</p>
                        <p className="font-medium">{viewingTransport.schedule.frequency}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Facilities */}
              {viewingTransport.facilities && viewingTransport.facilities.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-indigo-600" />
                    Facilities & Amenities
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingTransport.facilities.map((facility, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-indigo-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm capitalize">{facility.replace('-', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Booking */}
              {(viewingTransport.booking?.onlineUrl || viewingTransport.booking?.phoneNumbers?.length > 0) && (
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-pink-600" />
                    Booking Information
                  </h3>
                  <div className="space-y-3">
                    {viewingTransport.booking.onlineUrl && (
                      <div className="bg-white rounded p-3 border border-pink-100">
                        <p className="text-gray-600 text-xs mb-2">Online Booking</p>
                        <a 
                          href={viewingTransport.booking.onlineUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-700 underline font-medium flex items-center gap-1"
                        >
                          {viewingTransport.booking.onlineUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {viewingTransport.booking.phoneNumbers && viewingTransport.booking.phoneNumbers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Contact Numbers</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewingTransport.booking.phoneNumbers.map((phone, idx) => (
                            <div key={idx} className="bg-white border border-pink-200 rounded-lg p-2 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-pink-500" />
                              <a href={`tel:${phone}`} className="text-sm font-medium hover:text-pink-600">
                                {phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Created {new Date(viewingTransport.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setViewingTransport(null);
                    editTransport(viewingTransport);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Transport
                </button>
                <button 
                  onClick={() => setViewingTransport(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideTransport;
