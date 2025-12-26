import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function GuideHotelManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');

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

  // Rooms form
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
      toast.success('Hotel updated. Awaiting approval');
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
      const res = await api.post(`/hotels/${id}/rooms`, fd);
      const updated = res.data || res.data?.data;
      setHotel(updated);
      setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'USD', amenities: '', notes: '', photos: [] });
      toast.success('Room added');
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
              <label className="block text-sm font-medium mb-1">Add Images (append)</label>
              <input name="images" type="file" multiple onChange={onChange} className="input" />
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
                <div className="space-y-2">
                  {hotel.rooms.map((r, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 rounded border p-2">
                      <div>
                        <div className="font-medium">{r.roomType}</div>
                        <div className="text-xs text-gray-600">{r.bedType ? `Bed: ${r.bedType} • ` : ''}Sleeps {r.capacity} • {r.currency || 'USD'} {r.pricePerNight}/night</div>
                      </div>
                      <button className="btn-danger btn-sm" onClick={() => deleteRoom(idx)}>Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No rooms created yet.</p>
              )}
            </div>

            <div className="rounded bg-gray-50 p-3 space-y-2">
              <h3 className="font-semibold">Add Room</h3>
              <div className="grid md:grid-cols-2 gap-2">
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
                <button className="btn-primary" onClick={addRoom}>Add Room</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'gallery' && (
          <div className="mt-4">
            {hotel.images?.length ? (
              <div className="grid md:grid-cols-3 gap-3">
                {hotel.images.map((img, i) => (
                  <img key={i} src={img.url} alt={img.caption || `Image ${i+1}`} className="h-40 w-full rounded object-cover" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No images yet. Upload images from the Details tab (they will be appended).</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
