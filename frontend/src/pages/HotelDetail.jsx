import { ArrowLeft, BedDouble, Camera, Check, ChevronLeft, ChevronRight, DollarSign, Globe, Mail, MapPin, Phone, Star, Users, Wifi, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import './HotelDetail.css';

const formatAddress = (hotel) => {
  const a = hotel.address || hotel.locationId || {};
  const parts = [a.addressLine, a.city, a.state, a.country].filter(Boolean);
  return parts.join(', ');
};

const formatPriceRange = (priceRange) => {
  if (!priceRange) return 'Pricing unavailable';
  const currency = priceRange.currency || 'USD';
  if (priceRange.min && priceRange.max) return `${currency} ${priceRange.min} - ${priceRange.max} per night`;
  if (priceRange.min) return `From ${currency} ${priceRange.min} per night`;
  if (priceRange.max) return `Up to ${currency} ${priceRange.max} per night`;
  return 'Pricing unavailable';
};

const getImageUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;

  const file = img?.file ?? img;
  if (!file) return '';
  if (typeof file === 'string') return `/api/files/${file}`;
  if (typeof file === 'object') return file.url || (file._id ? `/api/files/${file._id}` : '');

  return '';
};

export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isOwner = useMemo(() => {
    if (!user || user.role !== 'guide' || !hotel?.guideId) return false;
    const gid = typeof hotel.guideId === 'string'
      ? hotel.guideId
      : (hotel.guideId?._id || hotel.guideId?.id);
    const uid = user._id || user.id;
    if (!gid || !uid) return false;
    return String(gid) === String(uid);
  }, [user, hotel]);

  // Add/Manage Rooms UI for guide owners
  const [manageOpen, setManageOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomType: '',
    bedType: '',
    capacity: 2,
    pricePerNight: 0,
    currency: 'USD',
    amenities: '',
    notes: '',
    photos: [],
  });

  // Edit hotel details (owner only)
  const [editOpen, setEditOpen] = useState(false);
  const [details, setDetails] = useState({
    name: '',
    description: '',
    amenities: '',
    priceMin: '',
    priceMax: '',
    currency: 'USD',
    phone: '',
    email: '',
    website: '',
    addressLine: '',
    city: '',
    country: '',
    zipCode: '',
    images: [],
  });

  const coverImage = useMemo(() => getImageUrl(hotel?.images?.[0]), [hotel]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRoomBar, setShowRoomBar] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomImageIndex, setRoomImageIndex] = useState(0);

  const allImages = useMemo(() => {
    if (!hotel?.images) return [];
    return hotel.images.map(img => getImageUrl(img)).filter(Boolean);
  }, [hotel]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const openRoomDetails = (room) => {
    setSelectedRoom(room);
    setRoomImageIndex(0);
    setShowRoomBar(true);
  };

  const nextRoomImage = () => {
    if (!selectedRoom?.photos?.length) return;
    setRoomImageIndex((prev) => (prev + 1) % selectedRoom.photos.length);
  };

  const prevRoomImage = () => {
    if (!selectedRoom?.photos?.length) return;
    setRoomImageIndex((prev) => (prev - 1 + selectedRoom.photos.length) % selectedRoom.photos.length);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/hotels/${id}`);
        console.log('[HotelDetail] Loaded hotel data:', data);
        console.log('[HotelDetail] Room photos:', data.rooms?.map(r => ({ 
          roomType: r.roomType, 
          photoCount: r.photos?.length,
          firstPhoto: r.photos?.[0]
        })));
        setHotel(data);
        setDetails({
          name: data.name || '',
          description: data.description || '',
          amenities: (data.amenities || []).join(', '),
          priceMin: data.priceRange?.min ?? '',
          priceMax: data.priceRange?.max ?? '',
          currency: data.priceRange?.currency || 'USD',
          phone: data.contactInfo?.phone || '',
          email: data.contactInfo?.email || '',
          website: data.contactInfo?.website || '',
          addressLine: data.address?.street || '',
          city: data.address?.city || '',
          country: data.address?.country || '',
          zipCode: data.address?.zipCode || '',
          images: [],
        });
      } catch (error) {
        toast.error(error?.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRoomChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photos') {
      setRoomForm(prev => ({ ...prev, photos: files }));
    } else {
      setRoomForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const addRoom = async () => {
    if (!roomForm.roomType) {
      toast.error('Room type is required');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('roomType', roomForm.roomType);
      if (roomForm.bedType) fd.append('bedType', roomForm.bedType);
      fd.append('capacity', String(roomForm.capacity || 1));
      fd.append('pricePerNight', String(roomForm.pricePerNight || 0));
      if (roomForm.currency) fd.append('currency', roomForm.currency);
      if (roomForm.amenities) {
        roomForm.amenities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(a => fd.append('amenities', a));
      }
      if (roomForm.notes) fd.append('notes', roomForm.notes);
      if (roomForm.photos && roomForm.photos.length) {
        Array.from(roomForm.photos).forEach((file) => fd.append('photos', file));
      }
      const res = await api.post(`/hotels/${id}/rooms`, fd);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      toast.success('Room added');
      setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'USD', amenities: '', notes: '', photos: [] });
      setManageOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to add room');
    }
  };

  const deleteRoom = async (index) => {
    const ok = window.confirm('Delete this room?');
    if (!ok) return;
    try {
      const res = await api.delete(`/hotels/${id}/rooms/${index}`);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      toast.success('Room deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete room');
    }
  };

  const onDetailsChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setDetails(prev => ({ ...prev, images: files }));
    } else {
      setDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveDetails = async () => {
    try {
      const fd = new FormData();
      if (details.name) fd.append('name', details.name);
      if (details.description) fd.append('description', details.description);
      if (details.amenities) {
        details.amenities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(a => fd.append('amenities', a));
      }
      const priceRange = {
        min: details.priceMin !== '' ? Number(details.priceMin) : undefined,
        max: details.priceMax !== '' ? Number(details.priceMax) : undefined,
        currency: details.currency || 'USD',
      };
      fd.append('priceRange', JSON.stringify(priceRange));
      const contactInfo = { phone: details.phone, email: details.email, website: details.website };
      fd.append('contactInfo', JSON.stringify(contactInfo));
      const address = { street: details.addressLine, city: details.city, country: details.country, zipCode: details.zipCode };
      fd.append('address', JSON.stringify(address));
      if (details.images && details.images.length) {
        Array.from(details.images).forEach((file) => fd.append('images', file));
      }
      const res = await api.put(`/hotels/${id}`, fd);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      toast.success('Details saved. Awaiting approval');
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="spinner" />
        <p className="mt-4 text-gray-600">Loading hotel...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="card">
        <p className="text-gray-600">Hotel not found.</p>
        <Link to="/hotels" className="btn btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Hotels
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Image Gallery */}
      <div className="relative">
        {allImages.length > 0 ? (
          <div className="relative h-[60vh] min-h-[500px] overflow-hidden group">
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${hotel.name} - Image ${currentImageIndex + 1}`} 
              className="h-full w-full object-cover" 
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Hotel Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="max-w-7xl mx-auto">
                <Link to="/hotels" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to Hotels
                </Link>
                
                <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">{hotel.name}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-lg">
                  <div className="flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Star className="h-5 w-5" fill="currentColor" />
                    <span className="font-bold">{hotel.rating?.average?.toFixed(1) || '0.0'}</span>
                    <span className="text-white/80">({hotel.rating?.count || 0} reviews)</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                    <span>{hotel.address?.city || hotel.locationId?.city || 'Location'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-semibold">{formatPriceRange(hotel.priceRange)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
                  <Camera className="h-4 w-4 inline mr-2" />
                  {currentImageIndex + 1} / {allImages.length}
                </div>
                
                {/* Thumbnail Navigation */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.slice(0, 8).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'w-12 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                  {allImages.length > 8 && (
                    <span className="text-white/70 text-xs ml-2">+{allImages.length - 8}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-[400px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="h-24 w-24 mx-auto mb-4 opacity-50" />
              <h1 className="text-5xl font-bold mb-2">{hotel.name}</h1>
              <p className="text-xl opacity-90">No photos available yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  About This Property
                </h2>
                {isOwner && (
                  <button 
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    onClick={() => setEditOpen(v => !v)}
                  >
                    {editOpen ? 'Cancel' : 'Edit Details'}
                  </button>
                )}
              </div>
              
              {!editOpen ? (
                <div className="space-y-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{hotel.description || 'No description available.'}</p>
                  
                  {hotel.amenities?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities & Features</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {hotel.amenities.map((am) => (
                          <div key={am} className="flex items-center gap-2 text-gray-700 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <span className="font-medium">{am}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                      <input name="name" value={details.name} onChange={onDetailsChange} className="input w-full" placeholder="Hotel name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                      <input name="amenities" value={details.amenities} onChange={onDetailsChange} className="input w-full" placeholder="WiFi, Pool, Gym" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={details.description} onChange={onDetailsChange} className="input w-full" rows={4} placeholder="Describe your hotel..." />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                      <input type="number" name="priceMin" value={details.priceMin} onChange={onDetailsChange} className="input w-full" placeholder="100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                      <input type="number" name="priceMax" value={details.priceMax} onChange={onDetailsChange} className="input w-full" placeholder="500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <input name="currency" value={details.currency} onChange={onDetailsChange} className="input w-full" placeholder="BDT" />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input name="phone" value={details.phone} onChange={onDetailsChange} className="input w-full" placeholder="+880..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input name="email" value={details.email} onChange={onDetailsChange} className="input w-full" placeholder="contact@hotel.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input name="website" value={details.website} onChange={onDetailsChange} className="input w-full" placeholder="https://..." />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                      <input name="addressLine" value={details.addressLine} onChange={onDetailsChange} className="input w-full" placeholder="123 Main Street" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input name="city" value={details.city} onChange={onDetailsChange} className="input w-full" placeholder="Dhaka" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input name="country" value={details.country} onChange={onDetailsChange} className="input w-full" placeholder="Bangladesh" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input name="zipCode" value={details.zipCode} onChange={onDetailsChange} className="input w-full" placeholder="1000" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload More Images</label>
                    <input name="images" type="file" multiple accept="image/*" onChange={onDetailsChange} className="input w-full" />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setEditOpen(false)}>
                      Cancel
                    </button>
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md" onClick={saveDetails}>
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rooms Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Available Rooms
                </h2>
                {isOwner && (
                  <button 
                    type="button" 
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    onClick={() => setManageOpen((v) => !v)}
                  >
                    {manageOpen ? 'Cancel' : '+ Add Room'}
                  </button>
                )}
              </div>
              
              {hotel.rooms?.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {hotel.rooms.map((room, idx) => (
                    <div 
                      key={idx} 
                      className="group relative rounded-2xl border-2 border-gray-200 overflow-hidden bg-white hover:border-blue-500 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      onClick={() => openRoomDetails(room)}
                    >
                      {/* Room Image */}
                      {getImageUrl(room.photos?.[0]) ? (
                        <div className="relative h-64 overflow-hidden">
                          <img 
                            src={getImageUrl(room.photos?.[0])} 
                            alt={room.roomType || 'Room photo'} 
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          
                          {/* Photo Count Badge */}
                          {room.photos?.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              {room.photos.length} Photos
                            </div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      ) : (
                        <div className="h-64 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <Camera className="w-16 h-16 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No photos yet</p>
                          </div>
                        </div>
                      )}

                      {/* Room Details */}
                      <div className="p-6 space-y-4">
                        {/* Room Type & Bed Type */}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{room.roomType || 'Room'}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {room.bedType && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <BedDouble className="w-4 h-4 text-gray-700" />
                                <span className="font-medium">{room.bedType}</span>
                              </div>
                            )}
                            {room.capacity && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <Users className="w-4 h-4 text-gray-700" />
                                <span className="font-medium">{room.capacity} Guests</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amenities */}
                        {room.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 4).map((am) => (
                              <span key={am} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-200">
                                {am}
                              </span>
                            ))}
                            {room.amenities.length > 4 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium border border-gray-300">
                                +{room.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & CTA */}
                        <div className="flex items-end justify-between pt-4 border-t border-gray-200">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Starting from</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-gray-900">{room.pricePerNight}</span>
                              <span className="text-lg text-gray-600 font-medium">{room.currency || 'BDT'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">per night</div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoomDetails(room);
                            }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            View Details
                          </button>
                        </div>

                        {room.notes && (
                          <p className="text-sm text-gray-600 italic pt-3 border-t">{room.notes}</p>
                        )}
                      </div>

                      {/* Owner Actions */}
                      {isOwner && (
                        <div className="px-6 pb-5" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            onClick={() => deleteRoom(idx)}
                          >
                            Delete Room
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <BedDouble className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 text-lg font-medium">No rooms available yet</p>
                  {isOwner && (
                    <p className="text-gray-500 text-sm mt-2">Click "Add Room" to create your first room listing</p>
                  )}
                </div>
              )}

              {isOwner && manageOpen && (
                <div className="mt-6 rounded-xl border-2 border-blue-200 p-6 bg-blue-50/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">+</div>
                    Add New Room
                  </h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                        <input name="roomType" value={roomForm.roomType} onChange={handleRoomChange} className="input w-full" placeholder="e.g., Deluxe Suite" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                        <input name="bedType" value={roomForm.bedType} onChange={handleRoomChange} className="input w-full" placeholder="e.g., King Size" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guest Capacity</label>
                        <input type="number" name="capacity" value={roomForm.capacity} onChange={handleRoomChange} className="input w-full" placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night</label>
                        <input type="number" step="0.01" name="pricePerNight" value={roomForm.pricePerNight} onChange={handleRoomChange} className="input w-full" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <input name="currency" value={roomForm.currency} onChange={handleRoomChange} className="input w-full" placeholder="BDT" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                        <input name="amenities" value={roomForm.amenities} onChange={handleRoomChange} className="input w-full" placeholder="WiFi, TV, AC" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Photos</label>
                      <input name="photos" type="file" multiple accept="image/*" onChange={handleRoomChange} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                      <textarea name="notes" value={roomForm.notes} onChange={handleRoomChange} className="input w-full" rows={2} placeholder="Any special information about this room..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setManageOpen(false)}>
                        Cancel
                      </button>
                      <button type="button" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md" onClick={addRoom}>
                        Add Room
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                Location
              </h3>
              <div className="space-y-3">
                <p className="text-gray-700">{formatAddress(hotel)}</p>
                {hotel.address?.city && (
                  <div className="pt-3 border-t">
                    <button className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4" />
                      View on Map
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Card */}
            {(hotel.contactInfo?.phone || hotel.contactInfo?.email || hotel.contactInfo?.website) && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {hotel.contactInfo?.phone && (
                    <a href={`tel:${hotel.contactInfo.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{hotel.contactInfo.phone}</div>
                      </div>
                    </a>
                  )}
                  {hotel.contactInfo?.email && (
                    <a href={`mailto:${hotel.contactInfo.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-medium text-sm">{hotel.contactInfo.email}</div>
                      </div>
                    </a>
                  )}
                  {hotel.contactInfo?.website && (
                    <a href={hotel.contactInfo.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Website</div>
                        <div className="font-medium text-sm truncate">Visit Website</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Rating Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Guest Rating</h3>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 bg-yellow-100 rounded-full mb-3">
                  <div className="text-3xl font-bold text-yellow-600">
                    {hotel.rating?.average?.toFixed(1) || '0.0'}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${
                        star <= Math.round(hotel.rating?.average || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm">
                  Based on {hotel.rating?.count || 0} review{hotel.rating?.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Room Details Modal/Drawer */}
      {showRoomBar && selectedRoom && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn" 
            onClick={() => setShowRoomBar(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto animate-slide-up">
            
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 className="text-3xl font-bold mb-1">{selectedRoom.roomType}</h2>
                <p className="text-blue-100 text-sm">Detailed room information</p>
              </div>
              <button 
                onClick={() => setShowRoomBar(false)}
                className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              
              {/* Room Images Gallery */}
              {selectedRoom.photos?.length > 0 ? (
                <div className="relative overflow-hidden rounded-2xl group shadow-2xl max-w-2xl mx-auto">
                  <div className="aspect-square w-full">
                    <img 
                      src={getImageUrl(selectedRoom.photos[roomImageIndex])} 
                      alt={selectedRoom.photos[roomImageIndex]?.caption || `Room photo ${roomImageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {/* Navigation Arrows */}
                  {selectedRoom.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevRoomImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextRoomImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      
                      {/* Thumbnail Indicators */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedRoom.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRoomImageIndex(idx)}
                            className={`h-2 rounded-full transition-all ${
                              idx === roomImageIndex ? 'w-12 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Photo Counter */}
                      <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
                        <Camera className="h-4 w-4 inline mr-2" />
                        {roomImageIndex + 1} / {selectedRoom.photos.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl aspect-square max-w-2xl mx-auto flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Camera className="h-20 w-20 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No photos available</p>
                  </div>
                </div>
              )}

              {/* Room Details Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Room Details</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <BedDouble className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Bed Type</div>
                          <div className="text-lg font-semibold text-gray-900">{selectedRoom.bedType || 'Not specified'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Guest Capacity</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedRoom.capacity || 1} Guest{selectedRoom.capacity > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">Pricing</h3>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-bold text-gray-900">{selectedRoom.pricePerNight}</span>
                      <div>
                        <div className="text-xl font-semibold text-gray-700">{selectedRoom.currency || 'BDT'}</div>
                        <div className="text-sm text-gray-600">per night</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  
                  {/* Amenities */}
                  {selectedRoom.amenities?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Wifi className="h-5 w-5" />
                        Room Amenities
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRoom.amenities.map((am) => (
                          <div key={am} className="flex items-center gap-2 text-gray-700 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-medium">{am}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Notes */}
                  {selectedRoom.notes && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-6">
                      <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-2">Additional Information</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedRoom.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 border-t">
                <button 
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={() => setShowRoomBar(false)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
