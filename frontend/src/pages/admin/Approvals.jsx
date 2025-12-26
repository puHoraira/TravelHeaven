import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { getImageUrlFromMixed } from '../../lib/media';
import { MapPin, Image as ImageIcon, User, Info, Clock, DollarSign, X } from 'lucide-react';

const AdminApprovals = () => {
  const [pending, setPending] = useState({ locations: [], hotels: [], transportation: [] });
  const [counts, setCounts] = useState({ locations: 0, hotels: 0, transportation: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(null); // { type: 'location'|'hotel'|'transport', id, data }
  const [fetchingView, setFetchingView] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending');
      setPending(res.data);
      if (res.counts) setCounts(res.counts);
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
      if (view && view.id === id) setView(null);
    } catch (err) {
      toast.error(err.message || 'Approve failed');
    }
  };

  const handleReject = async (type, id, reasonArg) => {
    const reason = reasonArg ?? window.prompt('Enter rejection reason');
    if (!reason) return;
    try {
      await api.put(`/admin/reject/${type}/${id}`, { reason });
      toast.success(`${type} rejected`);
      fetchPending();
      if (view && view.id === id) setView(null);
    } catch (err) {
      toast.error(err.message || 'Reject failed');
    }
  };

  const openView = async (type, id) => {
    setFetchingView(true);
    try {
      const endpointMap = {
        location: `/locations/${id}`,
        hotel: `/hotels/${id}`,
        transport: `/transportation/${id}`,
      };
      const res = await api.get(endpointMap[type]);
      // Support both shapes: {success:true, data: item} OR item
      const item = res?.data ?? res;
      setView({ type, id, data: item });
    } catch (err) {
      toast.error(err.message || 'Failed to load item');
    } finally {
      setFetchingView(false);
    }
  };

  const getImageUrl = (image) => {
    return getImageUrlFromMixed(image);
  };

  const totalPending = useMemo(() => counts?.total ?? (pending.locations.length + pending.hotels.length + pending.transportation.length), [counts, pending]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Pending Approvals</h1>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">Total: {totalPending}</span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Locations: {counts.locations ?? pending.locations.length}</span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Hotels: {counts.hotels ?? pending.hotels.length}</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">Transport: {counts.transportation ?? pending.transportation.length}</span>
          </div>
        </div>
        {loading && <p>Loading...</p>}

        <section className="mb-4">
          <h2 className="font-semibold">Locations</h2>
          {pending.locations.length === 0 && <p className="text-sm text-gray-500">No pending locations</p>}
          {pending.locations.map(loc => (
            <div key={loc._id} className="p-3 border rounded my-2 flex items-center gap-4">
              {loc.images?.[0] && (
                <img src={getImageUrl(loc.images[0])} alt={loc.name} className="w-24 h-16 object-cover rounded" onError={(e)=>{e.target.src='https://via.placeholder.com/160x96?text=No+Image';}} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{loc.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4" />{loc.city}, {loc.country}</div>
                {loc.category && <div className="text-xs mt-1 text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded">{loc.category}</div>}
                {loc.guideId && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><User className="w-3 h-3" />{loc.guideId?.profile ? `${loc.guideId.profile.firstName || ''} ${loc.guideId.profile.lastName || ''}`.trim() : (loc.guideId.username || 'Guide')}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary" onClick={() => openView('location', loc._id)}>View</button>
                <button className="btn btn-primary" onClick={() => handleApprove('location', loc._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('location', loc._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-4">
          <h2 className="font-semibold">Hotels</h2>
          {pending.hotels.length === 0 && <p className="text-sm text-gray-500">No pending hotels</p>}
          {pending.hotels.map(h => (
            <div key={h._id} className="p-3 border rounded my-2 flex items-center gap-4">
              {h.images?.[0] && (
                <img src={getImageUrl(h.images[0])} alt={h.name} className="w-24 h-16 object-cover rounded" onError={(e)=>{e.target.src='https://via.placeholder.com/160x96?text=No+Image';}} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{h.name}</div>
                <div className="text-sm text-gray-600">Location: {h.locationId?.name || h.locationId}</div>
                {h.guideId && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><User className="w-3 h-3" />{h.guideId?.profile ? `${h.guideId.profile.firstName || ''} ${h.guideId.profile.lastName || ''}`.trim() : (h.guideId.username || 'Guide')}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary" onClick={() => openView('hotel', h._id)}>View</button>
                <button className="btn btn-primary" onClick={() => handleApprove('hotel', h._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('hotel', h._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-semibold">Transportation</h2>
          {pending.transportation.length === 0 && <p className="text-sm text-gray-500">No pending transport</p>}
          {pending.transportation.map(t => (
            <div key={t._id} className="p-3 border rounded my-2 flex items-center gap-4">
              {t.images?.[0] && (
                <img src={getImageUrl(t.images[0])} alt={t.name} className="w-24 h-16 object-cover rounded" onError={(e)=>{e.target.src='https://via.placeholder.com/160x96?text=No+Image';}} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-sm text-gray-600">Type: {t.type}</div>
                {t.locationId && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.locationId?.name || t.locationId}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary" onClick={() => openView('transport', t._id)}>View</button>
                <button className="btn btn-primary" onClick={() => handleApprove('transport', t._id)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleReject('transport', t._id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Detail Modal */}
      {view && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Info className="text-blue-600" />
                Review {view.type.charAt(0).toUpperCase()+view.type.slice(1)} Submission
              </h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=>setView(null)}><X /></button>
            </div>
            <div className="p-4 space-y-4">
              {fetchingView ? (
                <p>Loading details…</p>
              ) : (
                <>
                  {/* Images */}
                  {view.data?.images?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><ImageIcon className="text-blue-600"/>Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {view.data.images.map((img, i)=> (
                          <img key={i} src={getImageUrl(img)} alt={`img-${i}`} className="w-full h-40 object-cover rounded" onError={(e)=>{e.target.src='https://via.placeholder.com/300x160?text=Image';}} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic info by type */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-semibold mb-2">Basic Info</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {view.data?.name}</div>
                        {view.type==='location' && (
                          <>
                            <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500" />{view.data?.city}, {view.data?.country}</div>
                            {view.data?.category && <div><span className="font-medium">Category:</span> {view.data.category}</div>}
                            {view.data?.coordinates?.latitude && (
                              <div className="text-xs text-gray-600">Lat/Lng: {view.data.coordinates.latitude}, {view.data.coordinates.longitude}</div>
                            )}
                            {view.data?.entryFee?.amount && (
                              <div className="text-xs text-gray-600 flex items-center gap-1"><DollarSign className="w-4 h-4" />{view.data.entryFee.currency} {view.data.entryFee.amount}</div>
                            )}
                          </>
                        )}

                        {view.type==='hotel' && (
                          <>
                            <div><span className="font-medium">Location:</span> {view.data?.locationId?.name || view.data?.locationId}</div>
                            {view.data?.price && <div><span className="font-medium">Price:</span> {view.data.price}</div>}
                          </>
                        )}

                        {view.type==='transport' && (
                          <>
                            <div><span className="font-medium">Type:</span> {view.data?.type}</div>
                            <div><span className="font-medium">Location:</span> {view.data?.locationId?.name || view.data?.locationId}</div>
                          </>
                        )}

                        {view.data?.openingHours && (
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{view.data.openingHours}</div>
                        )}
                        {view.data?.guideId && (
                          <div className="flex items-center gap-1 text-xs text-gray-600"><User className="w-4 h-4"/>Guide: {view.data.guideId?.profile ? `${view.data.guideId.profile.firstName || ''} ${view.data.guideId.profile.lastName || ''}`.trim() : (view.data.guideId.username || view.data.guideId)}</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-800 whitespace-pre-line">{view.data?.description || '—'}</p>
                    </div>
                  </div>

                  {/* Approve / Reject */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <button className="btn btn-secondary" onClick={()=>setView(null)}>Close</button>
                    <button className="btn btn-danger" onClick={()=>{
                      const reason = window.prompt('Enter rejection reason');
                      if (reason) handleReject(view.type, view.id, reason);
                    }}>Reject</button>
                    <button className="btn btn-primary" onClick={()=>handleApprove(view.type, view.id)}>Approve</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
