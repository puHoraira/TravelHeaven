import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Star, DollarSign, Phone, Mail, Globe, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

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

  const coverImage = useMemo(() => hotel?.images?.[0]?.url, [hotel]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/hotels/${id}`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/hotels" className="btn btn-ghost inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1 font-medium">
            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
            {hotel.rating?.average?.toFixed(1) || '0.0'}
            <span className="text-gray-400">({hotel.rating?.count || 0})</span>
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <DollarSign className="h-4 w-4" />
            {formatPriceRange(hotel.priceRange)}
          </span>
        </div>
      </div>

      {/* Gallery / Cover */}
      {coverImage && (
        <div className="overflow-hidden rounded-lg">
          <img src={coverImage} alt={hotel.name} className="h-64 w-full object-cover" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">About</h2>
              {isOwner && (
                <button className="btn-primary btn-sm" onClick={() => setEditOpen(v => !v)}>
                  {editOpen ? 'Cancel' : 'Edit details'}
                </button>
              )}
            </div>
            {!editOpen ? (
              <>
                <p className="text-gray-700">{hotel.description}</p>
                {hotel.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-sm text-blue-700">
                    {hotel.amenities.map((am) => (
                      <span key={am} className="rounded-full bg-blue-50 px-3 py-1">{am}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input name="name" value={details.name} onChange={onDetailsChange} className="input" placeholder="Hotel name" />
                  <input name="amenities" value={details.amenities} onChange={onDetailsChange} className="input" placeholder="Amenities (comma-separated)" />
                </div>
                <textarea name="description" value={details.description} onChange={onDetailsChange} className="input" rows={3} placeholder="Description" />
                <div className="grid md:grid-cols-3 gap-3">
                  <input type="number" name="priceMin" value={details.priceMin} onChange={onDetailsChange} className="input" placeholder="Price min" />
                  <input type="number" name="priceMax" value={details.priceMax} onChange={onDetailsChange} className="input" placeholder="Price max" />
                  <input name="currency" value={details.currency} onChange={onDetailsChange} className="input" placeholder="Currency" />
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <input name="phone" value={details.phone} onChange={onDetailsChange} className="input" placeholder="Phone" />
                  <input name="email" value={details.email} onChange={onDetailsChange} className="input" placeholder="Email" />
                  <input name="website" value={details.website} onChange={onDetailsChange} className="input" placeholder="Website" />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input name="addressLine" value={details.addressLine} onChange={onDetailsChange} className="input" placeholder="Address line" />
                  <input name="city" value={details.city} onChange={onDetailsChange} className="input" placeholder="City" />
                  <input name="country" value={details.country} onChange={onDetailsChange} className="input" placeholder="Country" />
                  <input name="zipCode" value={details.zipCode} onChange={onDetailsChange} className="input" placeholder="ZIP Code" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Append Images</label>
                  <input name="images" type="file" multiple onChange={onDetailsChange} className="input" />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={saveDetails}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* Rooms */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Rooms</h2>
              {isOwner && (
                <button type="button" className="btn-primary btn-sm" onClick={() => setManageOpen((v) => !v)}>
                  {manageOpen ? 'Cancel' : 'Add/Manage Rooms'}
                </button>
              )}
            </div>
            {hotel.rooms?.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {hotel.rooms.map((room, idx) => (
                  <div key={idx} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{room.roomType || 'Room'}</h3>
                        {room.bedType && <p className="text-sm text-gray-600">Bed: {room.bedType}</p>}
                        {room.capacity && <p className="text-sm text-gray-600">Sleeps: {room.capacity}</p>}
                      </div>
                      <div className="text-right font-medium text-gray-900">
                        {room.currency || 'USD'} {room.pricePerNight}
                        <div className="text-xs text-gray-500">per night</div>
                      </div>
                    </div>
                    {room.amenities?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-blue-700">
                        {room.amenities.map((am) => (
                          <span key={am} className="rounded-full bg-blue-50 px-3 py-1">{am}</span>
                        ))}
                      </div>
                    )}
                    {room.photos?.[0]?.url && (
                      <img src={room.photos[0].url} alt={room.photos[0].caption || 'Room photo'} className="mt-3 h-40 w-full rounded object-cover" />
                    )}
                    {room.notes && (
                      <p className="mt-2 text-sm text-gray-600">{room.notes}</p>
                    )}
                    {isOwner && (
                      <div className="mt-3 flex justify-end">
                        <button className="btn-danger btn-sm" onClick={() => deleteRoom(idx)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No rooms listed yet.</p>
            )}

            {isOwner && manageOpen && (
              <div className="rounded border p-4 bg-gray-50 space-y-3">
                <h3 className="font-semibold">Add a Room</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input name="roomType" value={roomForm.roomType} onChange={handleRoomChange} className="input" placeholder="Room type (e.g., Deluxe)" />
                  <input name="bedType" value={roomForm.bedType} onChange={handleRoomChange} className="input" placeholder="Bed type (e.g., King)" />
                  <input type="number" name="capacity" value={roomForm.capacity} onChange={handleRoomChange} className="input" placeholder="Capacity" />
                  <input type="number" step="0.01" name="pricePerNight" value={roomForm.pricePerNight} onChange={handleRoomChange} className="input" placeholder="Price per night" />
                  <input name="currency" value={roomForm.currency} onChange={handleRoomChange} className="input" placeholder="Currency" />
                  <input name="amenities" value={roomForm.amenities} onChange={handleRoomChange} className="input" placeholder="Amenities (comma-separated)" />
                  <input name="photos" type="file" multiple onChange={handleRoomChange} className="input md:col-span-2" />
                  <textarea name="notes" value={roomForm.notes} onChange={handleRoomChange} className="input md:col-span-2" rows={2} placeholder="Notes (optional)" />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="btn-primary" onClick={addRoom}>Add Room</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Contact & Location */}
        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Location</h2>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="mt-0.5 h-5 w-5" />
              <div>{formatAddress(hotel)}</div>
            </div>
          </div>

          {(hotel.contactInfo?.phone || hotel.contactInfo?.email || hotel.contactInfo?.website) && (
            <div className="card space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
              {hotel.contactInfo?.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" /> {hotel.contactInfo.phone}
                </div>
              )}
              {hotel.contactInfo?.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" /> {hotel.contactInfo.email}
                </div>
              )}
              {hotel.contactInfo?.website && (
                <a href={hotel.contactInfo.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                  <Globe className="h-4 w-4" /> Visit website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
