import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const GuideHotels = () => {
  const [myHotels, setMyHotels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    locationId: '',
    images: [],
  });

  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [roomForm, setRoomForm] = useState({
    roomType: '',
    bedType: '',
    capacity: 2,
    pricePerNight: 0,
    currency: 'USD',
    amenities: '', // comma-separated
    notes: '',
    photos: [],
  });
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hotelsRes, locationsRes] = await Promise.all([
        api.get('/hotels/my-hotels'),
        api.get('/locations'),
      ]);
      setMyHotels(hotelsRes.data || hotelsRes.data?.data || []);
      setLocations(locationsRes.data || locationsRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setForm(prev => ({ ...prev, images: files }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const submitHotel = async (e) => {
    e.preventDefault();
    if (!form.name || !form.locationId) {
      toast.error('Name and Location are required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.description) fd.append('description', form.description);
      fd.append('locationId', form.locationId);
      if (form.images && form.images.length) {
        Array.from(form.images).forEach((file) => fd.append('images', file));
      }
      const res = await api.post('/hotels', fd);
      const created = res.data || res.data?.data;
      toast.success('Hotel submitted for approval');
      setForm({ name: '', description: '', locationId: '', images: [] });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  // ROOM MANAGEMENT HELPERS
  const handleRoomChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photos') {
      setRoomForm(prev => ({ ...prev, photos: files }));
    } else {
      setRoomForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const addRoom = async (hotelId) => {
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
        const arr = roomForm.amenities.split(',').map(s => s.trim()).filter(Boolean);
        arr.forEach(a => fd.append('amenities', a));
      }
      if (roomForm.notes) fd.append('notes', roomForm.notes);
      if (roomForm.photos && roomForm.photos.length) {
        Array.from(roomForm.photos).forEach((file) => fd.append('photos', file));
      }
      const res = await api.post(`/hotels/${hotelId}/rooms`, fd);
      const updated = res.data || res.data?.data;
      setMyHotels(prev => prev.map(h => (h._id === hotelId ? updated : h)));
      toast.success('Room added');
      setRoomForm({ roomType: '', bedType: '', capacity: 2, pricePerNight: 0, currency: 'USD', amenities: '', notes: '', photos: [] });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to add room');
    }
  };

  const deleteRoom = async (hotelId, index) => {
    const ok = window.confirm('Delete this room?');
    if (!ok) return;
    try {
      const res = await api.delete(`/hotels/${hotelId}/rooms/${index}`);
      const updated = res.data || res.data?.data;
      setMyHotels(prev => prev.map(h => (h._id === hotelId ? updated : h)));
      toast.success('Room deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete room');
    }
  };

  const deleteHotel = async (id) => {
    const ok = window.confirm('Delete this hotel? This cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/hotels/${id}`);
      setMyHotels(prev => prev.filter(h => h._id !== id));
      toast.success('Hotel deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete');
    }
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
        <h1 className="text-2xl font-bold mb-4">Create Hotel</h1>
        <form onSubmit={submitHotel} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
              placeholder="Hotel name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location *</label>
            <select
              name="locationId"
              value={form.locationId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a location...</option>
              {locations.map(l => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Describe the hotel"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Images</label>
            <input name="images" type="file" multiple onChange={handleChange} className="input" />
            <p className="text-xs text-gray-500 mt-1">Up to 5 images.</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Hotels</h2>
          <span className="text-sm text-gray-600">{myHotels.length} total</span>
        </div>
        {myHotels.length === 0 ? (
          <p className="text-gray-600">No hotels yet. Create your first listing above.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myHotels.map(hotel => (
              <div key={hotel._id} className="border rounded-lg overflow-hidden">
                {hotel.images?.[0]?.url ? (
                  <Link to={`/hotels/${hotel._id}`}>
                    <img src={hotel.images[0].url} alt={hotel.name} className="w-full h-40 object-cover hover:opacity-95" />
                  </Link>
                ) : (
                  <Link to={`/hotels/${hotel._id}`} className="block">
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">No image</div>
                  </Link>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      <Link to={`/hotels/${hotel._id}`} className="hover:underline">
                        {hotel.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2">
                      {hotel.rooms?.length > 0 && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Rooms: {hotel.rooms.length}</span>
                      )}
                      {statusBadge(hotel.approvalStatus)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
                  <p className="text-xs text-gray-500">{hotel.locationId?.name || '—'}</p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Link 
                      to={`/hotels/${hotel._id}`} 
                      className="btn-secondary btn-sm"
                    >
                      Edit
                    </Link>
                    <button onClick={() => deleteHotel(hotel._id)} className="btn-danger btn-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideHotels;
