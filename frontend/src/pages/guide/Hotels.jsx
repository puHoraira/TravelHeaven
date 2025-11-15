import {
  BedDouble,
  Building2,
  Camera,
  CheckCircle,
  Clock,
  Crown,
  DollarSign,
  Edit2,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Hotel as HotelIcon,
  Image as ImageIcon,
  Info,
  Mail,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LocationSearchInput from '../../components/LocationSearchInput';
import api from '../../lib/api';
import './Hotels.css';

const GuideHotel = () => {
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingHotel, setViewingHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [imagePreview, setImagePreview] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalViews: 0,
    averageRating: 0
  });
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    locationId: '',
    // GPS-based location
    locationName: '',
    locationAddress: '',
    locationCoordinates: null,
    // Address details
    address: {
      street: '',
      city: '',
      country: '',
      zipCode: ''
    },
    // Contact
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    // Pricing
    priceRange: {
      min: '',
      max: '',
      currency: 'BDT'
    },
    // Amenities
    amenities: [],
    // Rooms
    rooms: [],
    images: []
  });

  // Room form state
  const [newRoom, setNewRoom] = useState({
    roomType: '',
    bedType: '',
    capacity: '',
    pricePerNight: '',
    currency: 'BDT',
    amenities: [],
    notes: ''
  });

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const fetchMyHotels = async () => {
    try {
      const response = await api.get('/hotels/my-hotels');
      const hotels = response.data || [];
      setMyHotels(hotels);
      
      // Calculate stats
      const stats = {
        total: hotels.length,
        approved: hotels.filter(h => h.approvalStatus === 'approved').length,
        pending: hotels.filter(h => h.approvalStatus === 'pending').length,
        rejected: hotels.filter(h => h.approvalStatus === 'rejected').length,
        totalViews: hotels.reduce((sum, h) => sum + (h.views || 0), 0),
        averageRating: hotels.length > 0 
          ? (hotels.reduce((sum, h) => sum + (h.rating?.average || 0), 0) / hotels.length).toFixed(1)
          : 0
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setForm(prev => ({ ...prev, [name]: files }));
      
      // Create image previews
      if (files && files.length > 0) {
        const previews = Array.from(files).map(file => URL.createObjectURL(file));
        setImagePreview(previews);
      }
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationSelect = (location) => {
    setForm(prev => ({
      ...prev,
      locationName: location.name,
      locationAddress: location.fullAddress,
      locationCoordinates: location.coordinates,
      address: {
        ...prev.address,
        street: location.fullAddress,
        city: location.coordinates?.city || prev.address.city,
        country: location.coordinates?.country || prev.address.country
      }
    }));
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleRoomAmenity = (amenity) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addRoom = () => {
    if (!newRoom.roomType || !newRoom.pricePerNight) {
      toast.error('Room type and price are required');
      return;
    }

    setForm(prev => ({
      ...prev,
      rooms: [...prev.rooms, { ...newRoom }]
    }));

    setNewRoom({
      roomType: '',
      bedType: '',
      capacity: '',
      pricePerNight: '',
      currency: 'BDT',
      amenities: [],
      notes: ''
    });
    toast.success('Room added');
  };

  const removeRoom = (index) => {
    setForm(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, idx) => idx !== index)
    }));
  };

  const submitHotel = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.description) {
      toast.error('Name and description are required');
      return;
    }

    if (!form.locationCoordinates) {
      toast.error('Please select a location with GPS coordinates');
      return;
    }

    if (form.rooms.length === 0) {
      toast.error('Please add at least one room');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      
      // Only append locationId if it exists and is not empty
      if (form.locationId && form.locationId.trim() !== '') {
        formData.append('locationId', form.locationId);
      }
      
      // GPS coordinates in GeoJSON format - [longitude, latitude]
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [
          parseFloat(form.locationCoordinates.longitude),
          parseFloat(form.locationCoordinates.latitude)
        ]
      }));

      // Address
      formData.append('address', JSON.stringify({
        street: form.address.street || '',
        city: form.address.city || '',
        country: form.address.country || '',
        zipCode: form.address.zipCode || ''
      }));
      
      // Contact
      formData.append('contactInfo', JSON.stringify({
        phone: form.contactInfo.phone || '',
        email: form.contactInfo.email || '',
        website: form.contactInfo.website || ''
      }));
      
      // Price range
      formData.append('priceRange', JSON.stringify({
        min: parseFloat(form.priceRange.min) || 0,
        max: parseFloat(form.priceRange.max) || 0,
        currency: form.priceRange.currency || 'BDT'
      }));

      // Amenities
      formData.append('amenities', JSON.stringify(form.amenities || []));

      // Rooms - ensure all fields are properly formatted
      const roomsData = form.rooms.map(room => ({
        roomType: room.roomType || '',
        bedType: room.bedType || '',
        capacity: parseInt(room.capacity) || 1,
        pricePerNight: parseFloat(room.pricePerNight) || 0,
        currency: room.currency || 'BDT',
        amenities: room.amenities || [],
        notes: room.notes || ''
      }));
      formData.append('rooms', JSON.stringify(roomsData));

      // Images
      if (form.images && form.images.length > 0) {
        Array.from(form.images).forEach(file => {
          formData.append('images', file);
        });
      }

      const response = await api.post('/hotels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Hotel submitted for approval!');
      fetchMyHotels();
      setActiveTab('list'); // Switch to list view
      setImagePreview([]); // Clear previews
      setEditingId(null);
      
      // Reset form
      setForm({
        name: '',
        description: '',
        locationId: '',
        locationName: '',
        locationAddress: '',
        locationCoordinates: null,
        address: { street: '', city: '', country: '', zipCode: '' },
        contactInfo: { phone: '', email: '', website: '' },
        priceRange: { min: '', max: '', currency: 'BDT' },
        amenities: [],
        rooms: [],
        images: []
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Failed to create hotel. Please check all fields.';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteHotel = async (id) => {
    if (!confirm('Delete this hotel?')) return;
    
    try {
      await api.delete(`/hotels/${id}`);
      toast.success('Hotel deleted');
      fetchMyHotels();
    } catch (error) {
      toast.error('Failed to delete hotel');
    }
  };

  const viewHotel = (hotel) => {
    setViewingHotel(hotel);
  };

  const editHotel = (hotel) => {
    setEditingId(hotel._id);
    setForm({
      name: hotel.name,
      description: hotel.description,
      locationId: hotel.locationId?._id || '',
      locationName: hotel.locationId?.name || '',
      locationAddress: hotel.address?.street || '',
      locationCoordinates: hotel.coordinates ? {
        latitude: hotel.coordinates.latitude,
        longitude: hotel.coordinates.longitude
      } : null,
      address: hotel.address || { street: '', city: '', country: '', zipCode: '' },
      contactInfo: hotel.contactInfo || { phone: '', email: '', website: '' },
      priceRange: hotel.priceRange || { min: '', max: '', currency: 'BDT' },
      amenities: hotel.amenities || [],
      rooms: hotel.rooms || [],
      images: []
    });
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter and search hotels
  const filteredHotels = myHotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hotel.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || hotel.approvalStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const commonAmenities = [
    'wifi', 'parking', 'pool', 'gym', 'restaurant', 'bar', 'spa', 'room-service',
    'laundry', 'ac', 'tv', 'breakfast', 'airport-shuttle', '24hr-front-desk'
  ];

  const roomAmenities = [
    'wifi', 'ac', 'tv', 'minibar', 'coffee-maker', 'safe', 'balcony', 'city-view', 'sea-view'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header with Stats */}
      <div className="hotels-header text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                <HotelIcon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
                  Hotel Management
                </h1>
                <p className="text-white text-opacity-90 mt-1">Manage your premium properties</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('create')}
              className="px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              style={{ backgroundColor: 'white', color: '#dc2626', border: 'none' }}
            >
              <Plus className="w-5 h-5" />
              Add New Hotel
            </button>
          </div>

          {/* Auto-Scrolling Stats Cards - Netflix Style */}
          <div className="stats-carousel-container">
            <div className="stats-carousel">
              {/* Duplicate stats for infinite scroll effect */}
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="flex gap-4">
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-red-600" />
                      <p className="text-xs text-gray-600">Total Hotels</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-xs text-gray-600">Approved</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <p className="text-xs text-gray-600">Rejected</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-gray-600">Total Views</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                  </div>
                  <div className="stat-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <p className="text-xs text-gray-600">Avg Rating</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full mt-6">
        <div className="tab-navigation" style={{ padding: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('list')}
            className={`rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'list' 
                ? 'tab-active text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:bg-gray-50 bg-white shadow'
            }`}
          >
            <Building2 className="w-5 h-5" />
            My Hotels ({myHotels.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create' 
                ? 'tab-active text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:bg-gray-50 bg-white shadow'
            }`}
          >
            <Plus className="w-5 h-5" />
            {editingId ? 'Edit Hotel' : 'Create New'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search hotels by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hotels Grid */}
            {filteredHotels.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <HotelIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Hotels Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by creating your first hotel'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Create Your First Hotel
                  </button>
                )}
              </div>
            ) : (
              <div className="hotels-grid-scroll grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map(h => (
                  <div key={h._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 group">
                    {/* Hotel Image */}
                    <div className="relative h-48 overflow-hidden">
                      {h.images?.[0]?.url ? (
                        <img src={h.images[0].url} alt={h.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                          <HotelIcon className="w-16 h-16 text-white opacity-60" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {statusBadge(h.approvalStatus)}
                      </div>
                      {/* Quick Stats Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="flex items-center justify-between text-white text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{h.views || 0} views</span>
                          </div>
                          {h.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{h.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-purple-600 transition-colors">{h.name}</h3>
                        {h.priceRange && (
                          <div className="bg-green-50 px-2 py-1 rounded-lg">
                            <Crown className="w-4 h-4 text-green-600 inline" />
                          </div>
                        )}
                      </div>
                      
                      {h.address?.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{h.address.city}, {h.address.country}</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 line-clamp-2">{h.description}</p>
                      
                      {h.priceRange && (
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <p className="text-xs text-gray-500">Starting from</p>
                            <p className="text-lg font-bold text-green-600">
                              {h.priceRange.currency} {h.priceRange.min}
                              <span className="text-xs text-gray-500 font-normal">/night</span>
                            </p>
                          </div>
                          {h.rooms?.length > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Total Rooms</p>
                              <p className="text-lg font-bold text-purple-600">{h.rooms.length}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Amenities Preview */}
                      {h.amenities && h.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {h.amenities.slice(0, 4).map(amenity => (
                            <span key={amenity} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                              {amenity}
                            </span>
                          ))}
                          {h.amenities.length > 4 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{h.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t">
                        <button 
                          onClick={() => viewHotel(h)} 
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 transform hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button 
                          onClick={() => editHotel(h)} 
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 transform hover:scale-105"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteHotel(h._id)} 
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 transform hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="w-6 h-6" />
                    Edit Hotel
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Create New Hotel
                  </>
                )}
              </h2>
              <p className="text-purple-100 text-sm mt-1">Fill in the details to {editingId ? 'update' : 'add'} your hotel property</p>
            </div>

            <form onSubmit={submitHotel} className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Info className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="e.g., Grand Plaza Hotel & Resort"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      rows="4"
                      placeholder="Describe your hotel, its unique features, and what makes it special for guests..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location with GPS */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPinned className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Location & Address</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Location *</label>
                  <LocationSearchInput
                    placeholder="Search for hotel location (e.g., Gulshan, Dhaka)"
                    onLocationSelect={handleLocationSelect}
                  />
                  {form.locationCoordinates && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">✓ Location Selected</p>
                      <p className="text-xs text-gray-600 mt-1">{form.locationName}</p>
                      <p className="text-xs text-gray-500">{form.locationAddress}</p>
                      {form.locationCoordinates.latitude && form.locationCoordinates.longitude && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          GPS: {form.locationCoordinates.latitude.toFixed(6)}, {form.locationCoordinates.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      name="address.city"
                      value={form.address.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="e.g., Dhaka"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      name="address.country"
                      value={form.address.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="e.g., Bangladesh"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      name="contactInfo.phone"
                      type="tel"
                      value={form.contactInfo.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="+880-XXX-XXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      name="contactInfo.email"
                      type="email"
                      value={form.contactInfo.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="info@hotel.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      name="contactInfo.website"
                      type="url"
                      value={form.contactInfo.website}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="https://hotel.com"
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Price Range</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price</label>
                    <input
                      name="priceRange.min"
                      type="number"
                      value={form.priceRange.min}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Price</label>
                    <input
                      name="priceRange.max"
                      type="number"
                      value={form.priceRange.max}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      name="priceRange.currency"
                      value={form.priceRange.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    >
                      <option value="BDT">BDT - Bangladeshi Taka</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Hotel Amenities</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {commonAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm capitalize">{amenity.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <BedDouble className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Rooms</h3>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-600" />
                    Add Room Type
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                      <input
                        value={newRoom.roomType}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, roomType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                        placeholder="e.g., Deluxe Double"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bed Type *</label>
                      <select
                        value={newRoom.bedType}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, bedType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                      >
                        <option value="">Select bed type</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="queen">Queen</option>
                        <option value="king">King</option>
                        <option value="twin">Twin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Guests) *</label>
                      <input
                        type="number"
                        value={newRoom.capacity}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                        placeholder="2"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night *</label>
                      <input
                        type="number"
                        value={newRoom.pricePerNight}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, pricePerNight: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                        placeholder="2500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Room Amenities</label>
                    <div className="grid grid-cols-3 gap-2">
                      {roomAmenities.map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-white p-2 rounded transition">
                          <input
                            type="checkbox"
                            checked={newRoom.amenities.includes(amenity)}
                            onChange={() => toggleRoomAmenity(amenity)}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="capitalize">{amenity.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={addRoom} 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Room to Hotel
                  </button>
                </div>

                {form.rooms.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Added Rooms ({form.rooms.length})
                    </h4>
                    <div className="space-y-2">
                      {form.rooms.map((room, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border-2 border-purple-100 rounded-lg hover:border-purple-300 transition-all">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{room.roomType}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              🛏️ {room.bedType} • 👥 {room.capacity} guests • 💰 {room.pricePerNight} {room.currency}/night
                            </p>
                            {room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {room.amenities.map((amenity, i) => (
                                  <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeRoom(idx)} 
                            className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Camera className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Hotel Images</h3>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-dashed border-blue-300">
                  <label className="cursor-pointer block">
                    <input 
                      name="images" 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleChange} 
                      className="hidden" 
                      id="imageUpload"
                    />
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                      <p className="text-lg font-semibold text-gray-700 mb-1">Upload Hotel Images</p>
                      <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, WebP (Max 5MB each)</p>
                    </div>
                  </label>
                </div>

                {imagePreview.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      Image Preview ({imagePreview.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreview.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${idx + 1}`} 
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-purple-400 transition-all"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingId(null);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingId ? 'Update Hotel' : 'Submit for Approval'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* View Hotel Modal */}
      {viewingHotel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingHotel(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HotelIcon className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">{viewingHotel.name}</h2>
                  <p className="text-sm text-purple-100">{viewingHotel.address?.city}, {viewingHotel.address?.country}</p>
                </div>
              </div>
              <button onClick={() => setViewingHotel(null)} className="text-white hover:text-purple-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-l-4 ${
                viewingHotel.approvalStatus === 'approved' ? 'bg-green-50 border-green-500' :
                viewingHotel.approvalStatus === 'pending' ? 'bg-yellow-50 border-yellow-500' :
                'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Status: {statusBadge(viewingHotel.approvalStatus)}</p>
                    {viewingHotel.rating?.average > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Rating: {viewingHotel.rating.average.toFixed(1)} ⭐ ({viewingHotel.rating.count} reviews)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Images */}
              {viewingHotel.images && viewingHotel.images.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingHotel.images.map((img, idx) => (
                      <img key={idx} src={img.url} alt={img.caption} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">{viewingHotel.description}</p>
              </div>

              {/* Location */}
              {viewingHotel.coordinates && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Location
                  </h3>
                  <p className="text-gray-700">{viewingHotel.address?.street}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Navigation className="w-3 h-3" />
                    <span className="font-mono">
                      {viewingHotel.coordinates.latitude?.toFixed(6)}, {viewingHotel.coordinates.longitude?.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}

              {/* Price Range */}
              {viewingHotel.priceRange && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Pricing
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    {viewingHotel.priceRange.min} - {viewingHotel.priceRange.max} {viewingHotel.priceRange.currency}
                  </p>
                  <p className="text-sm text-gray-600">per night</p>
                </div>
              )}

              {/* Rooms */}
              {viewingHotel.rooms && viewingHotel.rooms.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-indigo-600" />
                    Room Types ({viewingHotel.rooms.length})
                  </h3>
                  <div className="space-y-3">
                    {viewingHotel.rooms.map((room, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-indigo-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{room.roomType}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {room.bedType} bed • {room.capacity} guests
                            </p>
                            {room.amenities && room.amenities.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {room.amenities.join(', ')}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-indigo-700">
                            {room.pricePerNight} {room.currency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {viewingHotel.amenities && viewingHotel.amenities.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    Amenities
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingHotel.amenities.map((amenity, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2 border border-purple-100 flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="capitalize">{amenity.replace('-', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {viewingHotel.contactInfo && (
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-pink-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {viewingHotel.contactInfo.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-pink-500" />
                        <a href={`tel:${viewingHotel.contactInfo.phone}`} className="text-blue-600 hover:underline">
                          {viewingHotel.contactInfo.phone}
                        </a>
                      </p>
                    )}
                    {viewingHotel.contactInfo.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-pink-500" />
                        <a href={`mailto:${viewingHotel.contactInfo.email}`} className="text-blue-600 hover:underline">
                          {viewingHotel.contactInfo.email}
                        </a>
                      </p>
                    )}
                    {viewingHotel.contactInfo.website && (
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-pink-500" />
                        <a href={viewingHotel.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {viewingHotel.contactInfo.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Created {new Date(viewingHotel.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setViewingHotel(null);
                    editHotel(viewingHotel);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Hotel
                </button>
                <button 
                  onClick={() => setViewingHotel(null)}
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

export default GuideHotel;
