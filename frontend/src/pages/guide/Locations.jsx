import {
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  DollarSign,
  Edit,
  Eye,
  Image as ImageIcon,
  Info,
  MapPin,
  MapPinned,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ReviewSection from '../../components/ReviewSection';
import api from '../../lib/api';
import './Locations.css';

const GuideLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [attractions, setAttractions] = useState(['']);
  const [activities, setActivities] = useState(['']);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();

  useEffect(() => {
    fetchMyLocations();
  }, []);

  const fetchMyLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations/my-locations');
      setLocations(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch locations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const addAttractionField = () => setAttractions([...attractions, '']);
  const removeAttractionField = (index) => setAttractions(attractions.filter((_, i) => i !== index));
  const updateAttraction = (index, value) => {
    const updated = [...attractions];
    updated[index] = value;
    setAttractions(updated);
  };

  const addActivityField = () => setActivities([...activities, '']);
  const removeActivityField = (index) => setActivities(activities.filter((_, i) => i !== index));
  const updateActivity = (index, value) => {
    const updated = [...activities];
    updated[index] = value;
    setActivities(updated);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Basic fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('country', data.country);
      formData.append('city', data.city);
      formData.append('category', data.category);
      
      // Optional fields
      if (data.address) formData.append('address', data.address);
      if (data.latitude) formData.append('latitude', data.latitude);
      if (data.longitude) formData.append('longitude', data.longitude);
      if (data.bestTimeToVisit) formData.append('bestTimeToVisit', data.bestTimeToVisit);
      if (data.openingHours) formData.append('openingHours', data.openingHours);
      if (data.entryFeeAmount) formData.append('entryFeeAmount', data.entryFeeAmount);
      if (data.entryFeeCurrency) formData.append('entryFeeCurrency', data.entryFeeCurrency);
      if (data.entryFeeDetails) formData.append('entryFeeDetails', data.entryFeeDetails);
      
      // Arrays
      const validAttractions = attractions.filter(a => a.trim());
      const validActivities = activities.filter(a => a.trim());
      
      formData.append('attractions', JSON.stringify(validAttractions));
      formData.append('activities', JSON.stringify(validActivities));
      
      // Images
      images.forEach(image => {
        formData.append('images', image);
      });

      if (editingLocation) {
        await api.put(`/locations/${editingLocation._id}`, formData);
        toast.success('Location updated successfully!');
      } else {
        await api.post('/locations', formData);
        toast.success('Location created! Waiting for admin approval.');
      }

      resetForm();
      fetchMyLocations();
    } catch (error) {
      toast.error(error.message || 'Failed to save location');
      console.error(error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    reset();
    setImages([]);
    setImagePreview([]);
    setEditingLocation(null);
    setAttractions(['']);
    setActivities(['']);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setValue('name', location.name);
    setValue('description', location.description);
    setValue('country', location.country);
    setValue('city', location.city);
    setValue('category', location.category);
    setValue('address', location.address || '');
    setValue('latitude', location.coordinates?.latitude || '');
    setValue('longitude', location.coordinates?.longitude || '');
    setValue('bestTimeToVisit', location.bestTimeToVisit || '');
    setValue('openingHours', location.openingHours || '');
    setValue('entryFeeAmount', location.entryFee?.amount || '');
    setValue('entryFeeCurrency', location.entryFee?.currency || 'USD');
    setValue('entryFeeDetails', location.entryFee?.details || '');
    
    setAttractions(location.attractions?.length ? location.attractions : ['']);
    setActivities(location.activities?.length ? location.activities : ['']);
    
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await api.delete(`/locations/${id}`);
      toast.success('Location deleted successfully');
      fetchMyLocations();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  const handleViewDetails = (location) => {
    setSelectedLocation(location);
    setShowDetails(true);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  if (showDetails && selectedLocation) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              {selectedLocation.name}
            </h2>
            <button
              onClick={() => {
                setShowDetails(false);
                setSelectedLocation(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={28} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            {getStatusBadge(selectedLocation.approvalStatus)}
          </div>

          {/* Images Gallery */}
          {selectedLocation.images && selectedLocation.images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="text-blue-600" />
                Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLocation.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getImageUrl(image.url || image)}
                      alt={`${selectedLocation.name} - ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm rounded-b-lg">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Info className="text-blue-600" />
                  Basic Information
                </h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <p className="text-gray-900">{selectedLocation.city}, {selectedLocation.country}</p>
                  </div>
                  {selectedLocation.address && (
                    <div>
                      <span className="font-semibold text-gray-700">Address:</span>
                      <p className="text-gray-900">{selectedLocation.address}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Category:</span>
                    <p className="text-gray-900 capitalize">{selectedLocation.category}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Rating:</span>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-500 fill-yellow-500" size={18} />
                      <span className="text-gray-900 font-semibold">
                        {selectedLocation.rating?.average.toFixed(1) || '0.0'} 
                        <span className="text-gray-500 text-sm ml-1">
                          ({selectedLocation.rating?.count || 0} reviews)
                        </span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Views:</span>
                    <p className="text-gray-900 flex items-center gap-1">
                      <Eye size={16} />
                      {selectedLocation.views || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* GPS Coordinates */}
              {selectedLocation.coordinates?.latitude && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPinned className="text-blue-600" />
                    GPS Coordinates
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Latitude:</span>
                      <span className="text-gray-900">{selectedLocation.coordinates.latitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Longitude:</span>
                      <span className="text-gray-900">{selectedLocation.coordinates.longitude}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.coordinates.latitude},${selectedLocation.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full mt-2"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Visiting Information */}
            <div className="space-y-6">
              {/* Best Time to Visit */}
              {selectedLocation.bestTimeToVisit && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Best Time to Visit
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedLocation.bestTimeToVisit}</p>
                  </div>
                </div>
              )}

              {/* Opening Hours */}
              {selectedLocation.openingHours && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-blue-600" />
                    Opening Hours
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedLocation.openingHours}</p>
                  </div>
                </div>
              )}

              {/* Entry Fee */}
              {selectedLocation.entryFee?.amount && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="text-blue-600" />
                    Entry Fee
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedLocation.entryFee.currency} {selectedLocation.entryFee.amount}
                    </div>
                    {selectedLocation.entryFee.details && (
                      <p className="text-sm text-gray-700">{selectedLocation.entryFee.details}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="text-blue-600" />
              Description
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                {selectedLocation.description}
              </p>
            </div>
          </div>

          {/* Attractions */}
          {selectedLocation.attractions && selectedLocation.attractions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Compass className="text-blue-600" />
                Attractions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLocation.attractions.map((attraction, index) => (
                  <div key={index} className="bg-purple-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-900 flex-1">{attraction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {selectedLocation.activities && selectedLocation.activities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Compass className="text-blue-600" />
                Activities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLocation.activities.map((activity, index) => (
                  <div key={index} className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-900 flex-1">{activity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason if rejected */}
          {selectedLocation.approvalStatus === 'rejected' && selectedLocation.rejectionReason && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                <XCircle />
                Rejection Reason
              </h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-900">{selectedLocation.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <ReviewSection 
            reviewType="location"
            referenceId={selectedLocation._id}
            locationName={selectedLocation.name}
            guideId={selectedLocation.guideId?._id || selectedLocation.guideId}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t mt-6">
            <button
              onClick={() => {
                setShowDetails(false);
                handleEdit(selectedLocation);
              }}
              className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Location
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this location?')) {
                  handleDelete(selectedLocation._id);
                  setShowDetails(false);
                  setSelectedLocation(null);
                }
              }}
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Location
            </button>
            <button
              onClick={() => {
                setShowDetails(false);
                setSelectedLocation(null);
              }}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {editingLocation ? '✏️ Edit Location' : '➕ Add New Location'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingLocation(null);
                reset();
                setImages([]);
                setImagePreview([]);
                setAttractions(['']);
                setActivities(['']);
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Basic Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <MapPin className="text-blue-600" size={24} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white rounded-lg p-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    className="input text-lg"
                    placeholder="e.g., Eiffel Tower, Great Wall of China"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., France"
                    {...register('country', { required: 'Country is required' })}
                  />
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Paris"
                    {...register('city', { required: 'City is required' })}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Address
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Champ de Mars, 5 Avenue Anatole France, 75007 Paris"
                    {...register('address')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    className="input text-base"
                    {...register('category', { required: 'Category is required' })}
                  >
                    <option value="">Select a category</option>
                    <option value="historical">🏛️ Historical</option>
                    <option value="natural">🌳 Natural</option>
                    <option value="adventure">⛰️ Adventure</option>
                    <option value="cultural">🎭 Cultural</option>
                    <option value="beach">🏖️ Beach</option>
                    <option value="mountain">🗻 Mountain</option>
                    <option value="other">📍 Other</option>
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    className="input"
                    rows="6"
                    placeholder="Provide a detailed description of the location, its history, significance, what visitors can expect, and any special features..."
                    {...register('description', { 
                      required: 'Description is required', 
                      minLength: { value: 100, message: 'Description must be at least 100 characters' } 
                    })}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {watch('description')?.length || 0} / 100 characters minimum
                    </p>
                    {watch('description')?.length >= 100 && (
                      <span className="text-green-600 text-xs">✓ Good length!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Coordinates Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <MapPinned className="text-purple-600" size={24} />
                GPS Coordinates (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white rounded-lg p-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="e.g., 48.8584"
                    {...register('latitude')}
                  />
                  <p className="text-xs text-gray-500 mt-1">Decimal degrees format</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="e.g., 2.2945"
                    {...register('longitude')}
                  />
                  <p className="text-xs text-gray-500 mt-1">Decimal degrees format</p>
                </div>
              </div>
            </div>

            {/* Attractions Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <Compass className="text-green-600" size={24} />
                Main Attractions
              </h3>
              <div className="space-y-3 bg-white rounded-lg p-6">
                {attractions.map((attraction, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Attraction ${index + 1} - e.g., Observation deck, Historical exhibits, Photo spots`}
                      value={attraction}
                      onChange={(e) => updateAttraction(index, e.target.value)}
                    />
                    {attractions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttractionField(index)}
                        className="btn bg-red-50 text-red-600 hover:bg-red-100 px-3"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAttractionField}
                  className="btn bg-green-100 hover:bg-green-200 text-green-700 w-full font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Another Attraction
                </button>
              </div>
            </div>

            {/* Activities Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <Compass className="text-orange-600" size={24} />
                Available Activities
              </h3>
              <div className="space-y-3 bg-white rounded-lg p-6">
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Activity ${index + 1} - e.g., Photography, Guided tours, Hiking, Swimming`}
                      value={activity}
                      onChange={(e) => updateActivity(index, e.target.value)}
                    />
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivityField(index)}
                        className="btn bg-red-50 text-red-600 hover:bg-red-100 px-3"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addActivityField}
                  className="btn bg-orange-100 hover:bg-orange-200 text-orange-700 w-full font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Another Activity
                </button>
              </div>
            </div>

            {/* Visiting Information */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <Calendar className="text-cyan-600" size={24} />
                Visiting Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white rounded-lg p-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Best Time to Visit
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., April to October, Spring and Fall, All year round"
                    {...register('bestTimeToVisit')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 9:00 AM - 6:00 PM daily, Closed Mondays"
                    {...register('openingHours')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <DollarSign size={16} />
                    Entry Fee Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="e.g., 25.00"
                    {...register('entryFeeAmount')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency
                  </label>
                  <select className="input" {...register('entryFeeCurrency')}>
                    <option value="USD">💵 USD</option>
                    <option value="EUR">💶 EUR</option>
                    <option value="GBP">💷 GBP</option>
                    <option value="JPY">💴 JPY</option>
                    <option value="BDT">৳ BDT</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Entry Fee Details
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Free for children under 12, Discounts available for students"
                    {...register('entryFeeDetails')}
                  />
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
                <ImageIcon className="text-pink-600" size={24} />
                Location Images
              </h3>
              <div className="bg-white rounded-lg p-6">
                <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, GIF up to 5MB each (Maximum 5 images)
                    </p>
                  </label>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t-2">
              <button type="submit" className="btn btn-primary flex-1 text-lg py-3">
                {editingLocation ? '✓ Update Location' : '✓ Submit for Approval'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 text-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="locations-title text-2xl font-bold mb-2">My Locations</h1>
            <p className="text-gray-600">Manage your tourist locations</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Location
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No locations yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first location</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mx-auto"
          >
            Add Location
          </button>
        </div>
      ) : (
        <div className="locations-grid">
          {locations.map((location) => (
            <div key={location._id} className="location-card card">
              <div 
                className="cursor-pointer"
                onClick={() => handleViewDetails(location)}
              >
                {location.images && location.images.length > 0 ? (
                  <img
                    src={getImageUrl(location.images[0].url || location.images[0])}
                    alt={location.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg">{location.name}</h3>
                    {getStatusBadge(location.approvalStatus)}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {location.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{location.city}, {location.country}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" />
                      {location.rating?.average.toFixed(1) || '0.0'} ({location.rating?.count || 0})
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={16} />
                      {location.views || 0} views
                    </span>
                  </div>

                  {location.approvalStatus === 'rejected' && location.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {location.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(location);
                  }}
                  className="btn bg-green-50 text-green-600 hover:bg-green-100 flex-1 flex items-center justify-center gap-1"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(location);
                  }}
                  className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 flex-1 flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(location._id);
                  }}
                  className="btn bg-red-50 text-red-600 hover:bg-red-100 flex-1 flex items-center justify-center gap-1"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuideLocations;
