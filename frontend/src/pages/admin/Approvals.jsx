import { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const AdminApprovals = () => {
  const [pending, setPending] = useState({ locations: [], hotels: [], transportation: [] });
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending');
      setPending(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (type, id) => {
    try {
      await api.put(`/admin/approve/${type}/${id}`);
      toast.success(`${type} approved`);
      fetchPending();
    } catch (err) {
      toast.error(err.message || 'Approve failed');
    }
  };

  const handleReject = async (type, id) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;
    try {
      await api.put(`/admin/reject/${type}/${id}`, { reason });
      toast.success(`${type} rejected`);
      fetchPending();
    } catch (err) {
      toast.error(err.message || 'Reject failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Pending Approvals</h1>
        {loading && <p>Loading...</p>}

        <section className="mb-4">
          <h2 className="font-semibold">Locations</h2>
          {pending.locations.length === 0 && <p className="text-sm text-gray-500">No pending locations</p>}
          {pending.locations.map(loc => (
            <div key={loc._id} className="p-3 border rounded my-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{loc.name}</div>
                <div className="text-sm text-gray-600">{loc.city}, {loc.country}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-success" onClick={() => handleApprove('location', loc._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('location', loc._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-4">
          <h2 className="font-semibold">Hotels</h2>
          {pending.hotels.length === 0 && <p className="text-sm text-gray-500">No pending hotels</p>}
          {pending.hotels.map(h => (
            <div key={h._id} className="p-3 border rounded my-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{h.name}</div>
                <div className="text-sm text-gray-600">Location: {h.locationId?.name || h.locationId}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-success" onClick={() => handleApprove('hotel', h._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('hotel', h._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-semibold">Transportation</h2>
          {pending.transportation.length === 0 && <p className="text-sm text-gray-500">No pending transport</p>}
          {pending.transportation.map(t => (
            <div key={t._id} className="p-3 border rounded my-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-600">Type: {t.type}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-success" onClick={() => handleApprove('transport', t._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('transport', t._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AdminApprovals;
