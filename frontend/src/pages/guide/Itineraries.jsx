import { Globe, Lock, Plus, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function GuideItineraries() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/itineraries/my', { params: { page: 1, limit: 50 } });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to load itineraries');
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (err) {
      toast.error(err?.message || err || 'Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const guideItineraries = useMemo(() => {
    return (items || []).filter((it) => (it?.createdByRole || 'user') === 'guide');
  }, [items]);

  const togglePublic = async (itinerary) => {
    try {
      const res = await api.put(`/itineraries/${itinerary._id}`, { isPublic: !itinerary.isPublic });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to update itinerary');
      }
      toast.success(itinerary.isPublic ? 'Itinerary set to private' : 'Itinerary published');
      fetchMine();
    } catch (err) {
      toast.error(err?.message || err || 'Failed to update itinerary');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Itineraries</h1>
          <p className="text-gray-600">Create day-by-day plans for travelers and publish them to be discoverable.</p>
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={fetchMine}>
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/itineraries/create')}
          >
            <Plus size={16} />
            New Itinerary
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-6">Loading…</div>
      ) : guideItineraries.length === 0 ? (
        <div className="card p-6">
          <p className="text-gray-700">No guide itineraries yet.</p>
          <p className="text-gray-500 text-sm mt-1">Create one with “New Itinerary”.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guideItineraries.map((it) => (
            <div key={it._id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{it.title}</h3>
                  {it.destination && <p className="text-sm text-gray-600">Destination: {it.destination}</p>}
                  <p className="text-xs text-gray-500">Days: {Array.isArray(it.days) ? it.days.length : 0}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${it.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {it.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              <div className="flex gap-2">
                <Link to={`/itineraries/${it._id}`} className="btn btn-secondary">
                  Open
                </Link>
                <button type="button" className="btn btn-secondary" onClick={() => togglePublic(it)}>
                  {it.isPublic ? <Lock size={16} /> : <Globe size={16} />}
                  {it.isPublic ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
