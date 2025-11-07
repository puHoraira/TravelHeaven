import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const GuideTransport = () => {
  const [myTransports, setMyTransports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'bus',
    description: '',
    locationId: '',
    images: [],
  });

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
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const submitTransport = async (e) => {
    e.preventDefault();
    if (!form.name || !form.locationId || !form.type) {
      toast.error('Name, Type and Location are required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('type', form.type);
      if (form.description) fd.append('description', form.description);
      fd.append('locationId', form.locationId);
      if (form.images && form.images.length) {
        Array.from(form.images).forEach((file) => fd.append('images', file));
      }
      const res = await api.post('/transportation', fd);
      toast.success('Transport submitted for approval');
      setForm({ name: '', type: 'bus', description: '', locationId: '', images: [] });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to create');
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
        <h1 className="text-2xl font-bold mb-4">Create Transport</h1>
        <form onSubmit={submitTransport} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
              placeholder="Transport name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select name="type" value={form.type} onChange={handleChange} className="input" required>
              <option value="bus">Bus</option>
              <option value="train">Train</option>
              <option value="taxi">Taxi</option>
              <option value="rental-car">Rental Car</option>
              <option value="flight">Flight</option>
              <option value="boat">Boat</option>
              <option value="other">Other</option>
            </select>
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
              placeholder="Describe the transport"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Images</label>
            <input name="images" type="file" multiple onChange={handleChange} className="input" />
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
          <h2 className="text-xl font-bold">My Transportation</h2>
          <span className="text-sm text-gray-600">{myTransports.length} total</span>
        </div>
        {myTransports.length === 0 ? (
          <p className="text-gray-600">No transport yet. Create one above.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTransports.map(t => (
              <div key={t._id} className="border rounded-lg overflow-hidden">
                {t.images?.[0]?.url ? (
                  <img src={t.images[0].url} alt={t.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t.name}</h3>
                    {statusBadge(t.approvalStatus)}
                  </div>
                  <p className="text-xs text-gray-500">{t.type} • {t.locationId?.name || '—'}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button onClick={() => deleteTransport(t._id)} className="btn-danger btn-sm">Delete</button>
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

export default GuideTransport;
