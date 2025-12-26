import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const getImageUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;

  const file = img?.file ?? img;
  if (!file) return '';
  if (typeof file === 'string') return `/api/files/${file}`;
  if (typeof file === 'object') return file.url || (file._id ? `/api/files/${file._id}` : '');

  return '';
};

export default function GuideHotelManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);

  const [details, setDetails] = useState({
    name: '',
    description: '',
    amenities: '',
    priceMin: '',
    priceMax: '',
    currency: 'BDT',
    phone: '',
    email: '',
    website: '',
    addressLine: '',
    city: '',
    country: '',
    zipCode: '',
    images: [],
    location: null,
  });

  // Rooms form
  const [roomForm, setRoomForm] = useState({
    roomType: '',
    bedType: '',
    capacity: 2,
    pricePerNight: 0,
    currency: 'BDT',
    amenities: '',
    notes: '',
    photos: [],
  });

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
          currency: data.priceRange?.currency || 'BDT',
          phone: data.contactInfo?.phone || '',
          email: data.contactInfo?.email || '',
          website: data.contactInfo?.website || '',
          addressLine: data.address?.street || '',
          city: data.address?.city || '',
          country: data.address?.country || '',
          zipCode: data.address?.zipCode || '',
          images: [],
          location: data.location || null,
        });
      } catch (err) {
        toast.error(err?.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setDetails(prev => ({ ...prev, images: files }));
    } else {
      setDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveDetails = async () => {
    try {
      // Validation
      if (!details.name || details.name.trim().length < 3) {
        toast.error('Hotel name must be at least 3 characters');
        return;
      }
      if (!details.description || details.description.trim().length < 20) {
        toast.error('Description must be at least 20 characters');
        return;
      }
      if (!details.location) {
        toast.error('Location data is missing. Cannot update without location.');
        return;
      }

      const fd = new FormData();
      fd.append('name', details.name.trim());
      fd.append('description', details.description.trim());
      
      // Amenities as JSON array
      const amenitiesArray = details.amenities
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      fd.append('amenities', JSON.stringify(amenitiesArray));
      
      // Location (preserve existing GeoJSON coordinates)
      if (details.location) {
        fd.append('location', JSON.stringify(details.location));
      }
      
      // Price range
      const priceRange = {
        min: details.priceMin !== '' ? Number(details.priceMin) : undefined,
        max: details.priceMax !== '' ? Number(details.priceMax) : undefined,
        currency: details.currency || 'BDT',
      };
      fd.append('priceRange', JSON.stringify(priceRange));
      
      // Contact info
      const contactInfo = { 
        phone: details.phone, 
        email: details.email, 
        website: details.website 
      };
      fd.append('contactInfo', JSON.stringify(contactInfo));
      
      // Address
      const address = { 
        street: details.addressLine, 
        city: details.city, 
        country: details.country, 
        zipCode: details.zipCode 
      };
      fd.append('address', JSON.stringify(address));
      
      // Images (append new ones)
      if (details.images && details.images.length) {
        Array.from(details.images).forEach((file) => fd.append('images', file));
      }
      
      const res = await api.put(`/hotels/${id}`, fd);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      setDetails(prev => ({ ...prev, images: [] })); // Clear file input
      toast.success('Hotel updated successfully! Awaiting re-approval.');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save');
    }
  };

  const handleRoomChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photos') setRoomForm(prev => ({ ...prev, photos: files }));
    else setRoomForm(prev => ({ ...prev, [name]: value }));
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
      if (roomForm.amenities) roomForm.amenities.split(',').map(s=>s.trim()).filter(Boolean).forEach(a => fd.append('amenities', a));
      if (roomForm.notes) fd.append('notes', roomForm.notes);
      if (roomForm.photos && roomForm.photos.length) Array.from(roomForm.photos).forEach(f => fd.append('photos', f));
      
      let res;
      if (editingRoomIndex !== null) {
        // UPDATE existing room
        res = await api.put(`/hotels/${id}/rooms/${editingRoomIndex}`, fd);
        toast.success('Room updated');
      } else {
        // ADD new room
        res = await api.post(`/hotels/${id}/rooms`, fd);
        toast.success('Room added');
      }
      
      const updated = res.data || res.data?.data;
      setHotel(updated);
      setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'BDT', amenities: '', notes: '', photos: [] });
      setEditingRoomIndex(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || `Failed to ${editingRoomIndex !== null ? 'update' : 'add'} room`);
    }
  };

  const deleteRoom = async (index) => {
    const ok = window.confirm('Delete this room?');
    if (!ok) return;
    try {
      const res = await api.delete(`/hotels/${id}/rooms/${index}`);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      // Clear edit mode if deleting the room being edited
      if (editingRoomIndex === index) {
        setEditingRoomIndex(null);
        setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'BDT', amenities: '', notes: '', photos: [] });
      }
      toast.success('Room deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete room');
    }
  };

  const editRoom = (room, index) => {
    setRoomForm({
      roomType: room.roomType || '',
      bedType: room.bedType || '',
      capacity: room.capacity || 2,
      pricePerNight: room.pricePerNight || 0,
      currency: room.currency || 'BDT',
      amenities: (room.amenities || []).join(', '),
      notes: room.notes || '',
      photos: [],
    });
    setEditingRoomIndex(index);
  };

  const cancelEditRoom = () => {
    setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'BDT', amenities: '', notes: '', photos: [] });
    setEditingRoomIndex(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="spinner" />
        <p className="mt-4 text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="card">
        <p className="text-gray-600">Hotel not found.</p>
        <button className="btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn" onClick={() => navigate('/guide/hotels')}>← Back</button>
          <h1 className="text-2xl font-bold">Manage: {hotel.name}</h1>
        </div>
        <div className="text-sm text-gray-600">Status: <span className="font-medium">{hotel.approvalStatus}</span></div>
      </div>

      <div className="card">
        <div className="flex gap-2 border-b pb-2">
          <button className={`btn-tab ${tab==='details'?'active':''}`} onClick={()=>setTab('details')}>Details</button>
          <button className={`btn-tab ${tab==='rooms'?'active':''}`} onClick={()=>setTab('rooms')}>Rooms</button>
          <button className={`btn-tab ${tab==='gallery'?'active':''}`} onClick={()=>setTab('gallery')}>Gallery</button>
        </div>

        {tab === 'details' && (
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" value={details.name} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amenities</label>
              <input name="amenities" value={details.amenities} onChange={onChange} className="input" placeholder="AC, WiFi, Pool" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" value={details.description} onChange={onChange} className="input" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price Min</label>
              <input type="number" name="priceMin" value={details.priceMin} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price Max</label>
              <input type="number" name="priceMax" value={details.priceMax} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input name="currency" value={details.currency} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input name="phone" value={details.phone} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" value={details.email} onChange={onChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input name="website" value={details.website} onChange={onChange} className="input" />
            </div>
            <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address Line</label>
                <input name="addressLine" value={details.addressLine} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input name="city" value={details.city} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input name="country" value={details.country} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <input name="zipCode" value={details.zipCode} onChange={onChange} className="input" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Add More Images (will be appended)</label>
              <input name="images" type="file" multiple accept="image/*" onChange={onChange} className="input" />
              <p className="text-xs text-gray-500 mt-1">Select multiple images to add to the hotel gallery</p>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="btn-primary" onClick={saveDetails}>Save Details</button>
            </div>
          </div>
        )}

        {tab === 'rooms' && (
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Existing Rooms</h3>
              {hotel.rooms?.length ? (
                <div className="space-y-3">
                  {hotel.rooms.map((r, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded border p-3 space-y-2 transition-all ${
                        editingRoomIndex === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{r.roomType}</div>
                          <div className="text-xs text-gray-600">
                            {r.bedType ? `Bed: ${r.bedType} • ` : ''}
                            Sleeps {r.capacity} • {r.currency || 'USD'} {r.pricePerNight}/night
                          </div>
                          {r.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.amenities.map((am, i) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  {am}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            onClick={() => editRoom(r, idx)}
                            title="Edit room"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" 
                            onClick={() => deleteRoom(idx)}
                            title="Delete room"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {r.photos?.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {r.photos.map((photo, pi) => {
                            const photoUrl = getImageUrl(photo);
                            return photoUrl ? (
                              <img 
                                key={pi}
                                src={photoUrl}
                                alt={photo.caption || `Room photo ${pi + 1}`}
                                className="h-20 w-full rounded object-cover border border-gray-200"
                              />
                            ) : null;
                          })}
                        </div>
                      )}
                      {r.notes && (
                        <p className="text-xs text-gray-600 italic">{r.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No rooms created yet.</p>
              )}
            </div>

            <div className="rounded bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingRoomIndex !== null ? 'Edit Room' : 'Add Room'}
                </h3>
                {editingRoomIndex !== null && (
                  <button 
                    type="button"
                    onClick={cancelEditRoom} 
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <input name="roomType" value={roomForm.roomType} onChange={handleRoomChange} className="input" placeholder="Room type (e.g., Deluxe)" />
                <input name="bedType" value={roomForm.bedType} onChange={handleRoomChange} className="input" placeholder="Bed type (e.g., King)" />
                <input type="number" name="capacity" value={roomForm.capacity} onChange={handleRoomChange} className="input" placeholder="Capacity" />
                <input type="number" step="0.01" name="pricePerNight" value={roomForm.pricePerNight} onChange={handleRoomChange} className="input" placeholder="Price per night" />
                <input name="currency" value={roomForm.currency} onChange={handleRoomChange} className="input" placeholder="Currency" />
                <input name="amenities" value={roomForm.amenities} onChange={handleRoomChange} className="input" placeholder="Amenities (comma-separated)" />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Room Photos (Multiple)</label>
                  <input name="photos" type="file" multiple accept="image/*" onChange={handleRoomChange} className="input" />
                  <p className="text-xs text-gray-500 mt-1">Select multiple images for this room</p>
                </div>
                <textarea name="notes" value={roomForm.notes} onChange={handleRoomChange} className="input md:col-span-2" rows={2} placeholder="Notes (optional)" />
              </div>
              <div className="flex justify-end gap-2">
                {editingRoomIndex !== null && (
                  <button type="button" className="btn" onClick={cancelEditRoom}>
                    Cancel
                  </button>
                )}
                <button className="btn-primary" onClick={addRoom}>
                  {editingRoomIndex !== null ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'gallery' && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload More Images</label>
              <input name="images" type="file" multiple accept="image/*" onChange={onChange} className="input" />
              <p className="text-xs text-gray-500 mt-1">Select multiple images to upload them to the hotel gallery</p>
            </div>
            
            {hotel.images?.length ? (
              <div>
                <h3 className="text-sm font-medium mb-2">Current Hotel Images ({hotel.images.length})</h3>
                <div className="grid md:grid-cols-4 gap-3">
                  {hotel.images.map((img, i) => {
                    const imgUrl = getImageUrl(img);
                    return imgUrl ? (
                      <div key={i} className="relative group">
                        <img 
                          src={imgUrl} 
                          alt={img.caption || `Image ${i+1}`} 
                          className="h-40 w-full rounded object-cover border-2 border-gray-200 group-hover:border-red-400 transition-colors" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                            Image {i + 1}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No images yet. Upload images above or from the Details tab.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
