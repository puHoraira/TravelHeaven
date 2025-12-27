import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Calendar,
  Edit,
  Globe,
  History,
  Lightbulb,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import AddDayModal from '../../components/itinerary/AddDayModal';
import BudgetTracker from '../../components/itinerary/BudgetTracker';
import CollaboratorsList from '../../components/itinerary/CollaboratorsList';
import DayCard from '../../components/itinerary/DayCard';
import MapView from '../../components/itinerary/MapView';
import RailwaySearchWidget from '../../components/RailwaySearchWidget';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import './ViewItinerary.css';

/**
 * ViewItinerary Page - Display and edit itinerary details with interactive journey map
 * Design Patterns: 
 * - Observer Pattern: Updates propagate to collaborators
 * - Strategy Pattern: Different views for owner/collaborator/public
 */
export default function ViewItinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityType, setActivityType] = useState('comment');
  const [activityMessage, setActivityMessage] = useState('');
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const dayRefs = useRef([]);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [autoOpenAddStop, setAutoOpenAddStop] = useState(false);
  const [pinsGenerating, setPinsGenerating] = useState(false);
  const [pinsProgress, setPinsProgress] = useState(null);

  const normalizeId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value._id) return value._id.toString();
      if (value.id) return value.id.toString();
      if (typeof value.toString === 'function') {
        const stringValue = value.toString();
        if (stringValue !== '[object Object]') return stringValue;
      }
    }
    return `${value}`;
  };

  const currentUserId = normalizeId(user?._id || user?.id);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const hasCoords = (source) => {
    if (!source) return false;
    const latRaw = source.latitude ?? source.lat;
    const lngRaw = source.longitude ?? source.lng ?? source.lon;
    const lat = typeof latRaw === 'number' ? latRaw : parseFloat(latRaw);
    const lng = typeof lngRaw === 'number' ? lngRaw : parseFloat(lngRaw);
    return Number.isFinite(lat) && Number.isFinite(lng);
  };

  const hasMissingMapPins = useMemo(() => {
    if (!itinerary?.days?.length) return false;
    for (const day of itinerary.days) {
      for (const stop of day?.stops || []) {
        const hasAnyRef = Boolean(stop?.locationId || stop?.hotelId || stop?.transportId);
        const hasCustomCoords = hasCoords(stop?.customCoordinates);
        const hasMapCoords = hasCoords(stop?.coordinates);
        const hasName = Boolean(stop?.customName || stop?.name);
        const isCustomLike = stop?.type === 'custom' || !hasAnyRef;
        if (isCustomLike && hasName && !hasCustomCoords && !hasMapCoords) return true;
      }
    }
    return false;
  }, [itinerary]);

  const normalizeItineraryData = useCallback((rawItinerary) => {
    if (!rawItinerary) return rawItinerary;

    const normalizeCoordinate = (source) => {
      if (!source) return null;
      const latValue = source.lat ?? source.latitude;
      const lngValue = source.lng ?? source.longitude;
      const lat = typeof latValue === 'number' ? latValue : parseFloat(latValue);
      const lng = typeof lngValue === 'number' ? lngValue : parseFloat(lngValue);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
      return null;
    };

    const normalizeStop = (stop) => {
      const location = stop?.locationId && typeof stop.locationId === 'object' ? stop.locationId : null;
      const hotel = stop?.hotelId && typeof stop.hotelId === 'object' ? stop.hotelId : null;
      const transport = stop?.transportId && typeof stop.transportId === 'object' ? stop.transportId : null;

      const resolvedType = stop?.type
        || (location ? 'location'
        : hotel ? 'hotel'
        : transport ? 'transport'
        : 'custom');

      const resolvedCoordinates = normalizeCoordinate(stop?.coordinates)
        || normalizeCoordinate(stop?.customCoordinates)
        || normalizeCoordinate(location?.coordinates)
        || normalizeCoordinate(hotel?.coordinates)
        || normalizeCoordinate(transport?.coordinates);

      const resolvedName = stop?.name
        || stop?.customName
        || location?.name
        || hotel?.name
        || transport?.name
        || undefined;

      return {
        ...stop,
        type: resolvedType,
        name: resolvedName,
        coordinates: resolvedCoordinates || undefined,
      };
    };

    const normalizedDays = (rawItinerary.days || []).map((day) => ({
      ...day,
      stops: (day.stops || []).map(normalizeStop),
    }));

    return {
      ...rawItinerary,
      days: normalizedDays,
    };
  }, []);

  const geocodePlaceName = useCallback(async (rawName) => {
    const name = String(rawName || '').trim();
    if (!name) return null;

    const destinationContext = itinerary?.destination ? `, ${itinerary.destination}` : '';
    const queries = [
      `${name}${destinationContext}`.trim(),
      destinationContext ? `${name}, Bangladesh` : `${name}${destinationContext}`.trim(),
      `${name}`.trim(),
    ].filter(Boolean);

    const fetchOne = async (query) => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        // Nominatim can rate-limit (429) or temporarily fail (503).
        if (response.status === 429 || response.status === 503) {
          await sleep(1500);
        }
        return null;
      }
      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;
      if (!first) return null;
      const latitude = parseFloat(first.lat);
      const longitude = parseFloat(first.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { latitude, longitude };
    };

    try {
      for (const query of queries) {
        const coords = await fetchOne(query);
        if (coords) return coords;
        await sleep(250);
      }
      return null;
    } catch {
      return null;
    }
  }, [itinerary?.destination]);

  const handleGenerateMapPins = useCallback(async () => {
    if (!itinerary?.days?.length) {
      toast.error('No itinerary days found');
      return;
    }

    if (pinsGenerating) return;
    setPinsGenerating(true);
    setPinsProgress({ done: 0, total: 0 });

    try {
      const cache = new globalThis.Map();
      const missing = [];
      let resolvedCount = 0;

      itinerary.days.forEach((day, dayIndex) => {
        (day?.stops || []).forEach((stop, stopIndex) => {
          const hasAnyRef = Boolean(stop?.locationId || stop?.hotelId || stop?.transportId);
          const hasCustomCoords = hasCoords(stop?.customCoordinates);
          const hasMapCoords = hasCoords(stop?.coordinates);
          const hasName = Boolean(stop?.customName || stop?.name);
          const isCustomLike = stop?.type === 'custom' || !hasAnyRef;
          if (isCustomLike && hasName && !hasCustomCoords && !hasMapCoords) {
            missing.push({ dayIndex, stopIndex, name: stop.customName || stop.name });
          }
        });
      });

      if (!missing.length) {
        toast.success('No missing map pins found');
        return;
      }

      setPinsProgress({ done: 0, total: missing.length });

      const updatedDays = itinerary.days.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title,
        description: day.description,
        stops: (day.stops || []).map((stop) => {
          const toId = (value) => {
            if (!value) return undefined;
            if (typeof value === 'string') return value;
            if (typeof value === 'object') return value._id || value.id || undefined;
            return undefined;
          };

          return {
            locationId: toId(stop.locationId),
            hotelId: toId(stop.hotelId),
            transportId: toId(stop.transportId),
            timeOfDay: stop.timeOfDay,
            customName: stop.customName,
            customDescription: stop.customDescription,
            customCoordinates: stop.customCoordinates,
            order: stop.order,
            notes: stop.notes,
            estimatedCost: stop.estimatedCost,
          };
        }),
      }));

      for (let i = 0; i < missing.length; i++) {
        const item = missing[i];
        const key = String(item.name || '').trim().toLowerCase();

        let coords = cache.get(key);
        if (coords === undefined) {
          coords = await geocodePlaceName(item.name);
          cache.set(key, coords || null);
          await sleep(1100);
        }

        if (coords) {
          const targetStop = updatedDays[item.dayIndex]?.stops?.[item.stopIndex];
          if (targetStop) {
            targetStop.customCoordinates = {
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
            if (!targetStop.customName && item.name) {
              targetStop.customName = item.name;
            }
            resolvedCount += 1;
          }
        }

        setPinsProgress({ done: i + 1, total: missing.length });
      }

      if (resolvedCount === 0) {
        toast.error('Could not find coordinates for any stops. Try more specific place names.');
        return;
      }

      const updateResponse = await api.put(`/itineraries/${id}`, { days: updatedDays });
      const updated = updateResponse?.data || updateResponse;
      const normalizedUpdated = normalizeItineraryData(updated);
      setItinerary(normalizedUpdated);

      toast.success(`Added pins for ${resolvedCount}/${missing.length} stops`);
    } catch (error) {
      console.error('Failed to generate map pins:', error);
      toast.error(error?.message || 'Failed to generate map pins');
    } finally {
      setPinsGenerating(false);
      setPinsProgress(null);
    }
  }, [geocodePlaceName, id, itinerary, normalizeItineraryData, pinsGenerating]);

  const fetchItinerary = useCallback(async () => {
    try {
      const endpoint = location.pathname.endsWith('/view')
        ? `/itineraries/${id}/view`
        : `/itineraries/${id}`;
      const response = await api.get(endpoint);
      
      // Backend returns { success, data: itinerary }
      const itineraryData = response.data || response;
      const normalizedItinerary = normalizeItineraryData(itineraryData);
      setItinerary(normalizedItinerary);
      const likeList = Array.isArray(normalizedItinerary.likes) ? normalizedItinerary.likes : [];
      setLikesCount(likeList.length);
      if (user) {
        const userId = user._id || user.id;
        const hasSubscribed = likeList.some((like) => {
          if (!like) return false;
          if (typeof like === 'string') return like === userId;
          if (typeof like === 'object') {
            return like._id === userId || like.id === userId || like.toString?.() === userId;
          }
          return false;
        });
        setIsSubscribed(hasSubscribed);
      } else {
        setIsSubscribed(false);
      }
      setEditForm({
        title: normalizedItinerary.title || '',
        description: normalizedItinerary.description || '',
        isPublic: normalizedItinerary.isPublic || false,
      });

      const activityEntries = Array.isArray(normalizedItinerary.activityLog)
        ? [...normalizedItinerary.activityLog].sort(
            (first, second) => new Date(second.createdAt) - new Date(first.createdAt)
          )
        : [];
      setActivityLog(activityEntries);
      setActivityMessage('');
      setActivityType('comment');

      try {
        await api.post(`/itineraries/${id}/view`);
      } catch (viewError) {
        console.error('Failed to record view:', viewError);
      }
    } catch (error) {
      console.error('Failed to load itinerary:', error);
      toast.error(error?.message || 'Failed to load itinerary');
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  }, [id, location.pathname, navigate, normalizeItineraryData, user]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const ownerId = normalizeId(itinerary?.ownerId);
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);

  const collaboratorEntry = useMemo(() => {
    if (!itinerary || !currentUserId) return null;
    return itinerary.collaborators?.find((collaborator) => normalizeId(collaborator.userId) === currentUserId) || null;
  }, [itinerary, currentUserId]);

  const canEdit = Boolean(isOwner || (collaboratorEntry && collaboratorEntry.permission === 'edit'));
  const canCollaborate = Boolean(
    isOwner || (collaboratorEntry && ['edit', 'comment', 'suggest'].includes(collaboratorEntry.permission))
  );

  const handleSaveBasicInfo = async () => {
    try {
      await api.put(`/itineraries/${id}`, editForm);
      toast.success('Itinerary updated');
      setEditing(false);
      fetchItinerary();
    } catch (error) {
      toast.error('Failed to update itinerary');
      console.error(error);
    }
  };

  const handleDeleteItinerary = async () => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
    
    try {
      await api.delete(`/itineraries/${id}`);
      toast.success('Itinerary deleted');
      navigate('/itineraries');
    } catch (error) {
      toast.error('Failed to delete itinerary');
      console.error(error);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await api.delete(`/itineraries/${id}/collaborators`, { data: { userId } });
      toast.success('Collaborator removed');
      fetchItinerary();
    } catch (error) {
      toast.error('Failed to remove collaborator');
      console.error(error);
    }
  };

  const handleExpensesChange = async (updatedExpenses) => {
    try {
      await api.put(`/itineraries/${id}`, {
        budget: {
          ...itinerary.budget,
          expenses: updatedExpenses
        }
      });
      toast.success('Expenses updated');
      fetchItinerary();
    } catch (error) {
      toast.error('Failed to update expenses');
      console.error(error);
    }
  };

  const handleSaveDay = async (dayData) => {
    try {
      await api.put(`/itineraries/${id}`, {
        days: [...(itinerary.days || []), dayData]
      });
      
      toast.success('Day added successfully!');
      setShowAddDayModal(false);
      fetchItinerary();
    } catch (error) {
      console.error('Failed to add day:', error);
      toast.error('Failed to add day. Please try again.');
    }
  };

  const handleUpdateDay = async (dayData) => {
    try {
      const updated = [...(itinerary.days || [])];
      if (editingDayIndex == null || editingDayIndex < 0 || editingDayIndex >= updated.length) {
        toast.error('Invalid day selected');
        return;
      }
      updated[editingDayIndex] = {
        ...updated[editingDayIndex],
        ...dayData,
      };
      await api.put(`/itineraries/${id}`, { days: updated });
      toast.success('Day updated successfully!');
      setShowEditDayModal(false);
      setEditingDayIndex(null);
      setAutoOpenAddStop(false);
      fetchItinerary();
    } catch (error) {
      console.error('Failed to update day:', error);
      toast.error('Failed to update day. Please try again.');
    }
  };

  const openEditDay = (index, { addStop = false } = {}) => {
    setEditingDayIndex(index);
    setAutoOpenAddStop(Boolean(addStop));
    setShowEditDayModal(true);
  };

  const handleToggleSubscribe = async () => {
    if (!user) {
      toast.error('Login required to subscribe');
      navigate('/login');
      return;
    }

    try {
      setSubscribeLoading(true);
      const response = await api.post(`/itineraries/${id}/like`);
      const likes = response?.data?.likes ?? response?.likes ?? likesCount;
      setLikesCount(likes);
      const nextSubscribed = !isSubscribed;
      setIsSubscribed(nextSubscribed);
      toast.success(nextSubscribed ? 'Trip saved to your subscriptions' : 'Removed from subscriptions');
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error(error?.message || 'Failed to update subscription');
    } finally {
      setSubscribeLoading(false);
    }
  };

  const getProfileName = (profile, fallback = '') => {
    if (!profile) return fallback;
    const firstName = profile.firstName?.trim();
    const lastName = profile.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.displayName || fallback;
  };

  const resolveUserLabel = (targetId) => {
    const candidateId = normalizeId(targetId);
    if (!candidateId) return 'System';

    if (ownerId && candidateId === ownerId) {
      const fallback = itinerary?.ownerId?.username || 'Owner';
      return getProfileName(itinerary?.ownerId?.profile, fallback) || 'Owner';
    }

    const collaboratorMatch = itinerary?.collaborators?.find(
      (entry) => normalizeId(entry.userId) === candidateId
    );
    if (collaboratorMatch) {
      const fallback = collaboratorMatch.userId?.username || 'Collaborator';
      return getProfileName(collaboratorMatch.userId?.profile, fallback) || 'Collaborator';
    }

    if (candidateId === currentUserId) {
      const fallback = user?.username || 'You';
      return getProfileName(user?.profile, fallback) || 'You';
    }

    return 'Team member';
  };

  const formatActivityRelativeTime = (value) => {
    if (!value) return '';
    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return '';

    const diffMs = Date.now() - dateValue.getTime();
    if (diffMs < 60 * 1000) return 'just now';

    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

    return dateValue.toLocaleString();
  };

  const handleSubmitActivity = async (event) => {
    event.preventDefault();
    if (!activityMessage.trim()) {
      toast.error('Add a short message first');
      return;
    }

    try {
      setActivitySubmitting(true);
      const payload = await api.post(`/itineraries/${id}/collaboration/activity`, {
        type: activityType,
        message: activityMessage.trim(),
      });

      const entry = payload?.data || payload;
      entry.createdAt = entry.createdAt || new Date().toISOString();
      entry.createdBy = entry.createdBy || currentUserId;
      entry.type = entry.type || activityType;

      setActivityLog((previous) =>
        [...(previous || []), entry]
          .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      );
      setActivityMessage('');
      setActivityType('comment');
      toast.success('Shared with collaborators');
    } catch (error) {
      console.error('Failed to record collaboration activity:', error);
      toast.error(error?.message || 'Failed to share activity');
    } finally {
      setActivitySubmitting(false);
    }
  };

  // Gather all stops from all days for map display
  const allStops = itinerary?.days?.flatMap((day, dayIndex) => 
    day.stops?.map(stop => ({ ...stop, dayNumber: dayIndex + 1 })) || []
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Itinerary not found</h3>
        <Link to="/itineraries" className="text-blue-600 hover:underline">
          Back to itineraries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link to="/itineraries" className="back-link inline-flex items-center gap-2 mb-4">
        <ArrowLeft size={20} />
        Back to My Itineraries
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="view-itinerary-card card">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this itinerary public
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveBasicInfo} className="btn-primary flex items-center gap-2">
                    <Save size={16} />
                    Save Changes
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="itinerary-title text-3xl font-bold">{itinerary.title}</h1>
                      {itinerary.isPublic ? (
                        <Globe className="icon-red" title="Public" />
                      ) : (
                        <Lock className="text-gray-400" title="Private" />
                      )}
                    </div>
                    {itinerary.description && (
                      <p className="text-gray-600">{itinerary.description}</p>
                    )}
                  </div>
                  
                  {(itinerary.isPublic && !isOwner) || canEdit || isOwner ? (
                    <div className="flex gap-2">
                      {itinerary.isPublic && !isOwner && (
                        <button
                          onClick={handleToggleSubscribe}
                          className={`btn-secondary flex items-center gap-2 ${isSubscribed ? 'btn-subscribed' : ''}`}
                          disabled={subscribeLoading}
                        >
                          {isSubscribed ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                          {isSubscribed ? 'Subscribed' : 'Subscribe'}
                          {likesCount > 0 && <span className="ml-1 text-xs text-gray-500">({likesCount})</span>}
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => setEditing(true)}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={handleDeleteItinerary}
                          className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {itinerary.startDate && itinerary.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>
                        {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{allStops.length} stops</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{itinerary.collaborators?.length || 0} collaborators</span>
                  </div>
                  {likesCount > 0 && (
                    <div className="flex items-center gap-1">
                      <BookmarkCheck size={16} />
                      <span>{likesCount} subscribed</span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    itinerary.status === 'active' ? 'status-badge-active' :
                    itinerary.status === 'completed' ? 'status-badge-completed' :
                    'status-badge-planning'
                  }`}>
                    {itinerary.status}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Days */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-header-red text-2xl font-bold">Day by Day</h2>
              {canEdit && (
                <button 
                  onClick={() => setShowAddDayModal(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Day
                </button>
              )}
            </div>
            
            {itinerary.days && itinerary.days.length > 0 ? (
              <div className="space-y-4">
                {itinerary.days.map((day, index) => (
                  <div
                    key={day._id || index}
                    ref={(el) => (dayRefs.current[index] = el)}
                    onClick={() => setActiveDay(index)}
                  >
                    <DayCard
                      day={day}
                      dayNumber={index + 1}
                      editable={canEdit}
                      isActive={activeDay === index}
                      onEditDay={(i) => openEditDay(i)}
                      onAddStop={(i) => openEditDay(i, { addStop: true })}
                    />
                    
                    {/* Railway Search Widget */}
                    {day.stops && day.stops.length > 0 && (
                      <div className="mt-4">
                        <RailwaySearchWidget
                          from={day.stops[0]?.name || ''}
                          to={day.stops.length > 1 ? day.stops[day.stops.length - 1]?.name : day.stops[0]?.name}
                          date={day.date}
                          onSelectTrain={(train) => {
                            toast.success(`Selected: ${train.tripNumber}`);
                            console.log('Selected train:', train);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <Calendar size={48} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No days planned yet</p>
                {canEdit && <p className="text-sm text-gray-500 mt-1">Click "Add Day" to start planning</p>}
              </div>
            )}
          </div>

          {/* Map View */}
          <div className="view-itinerary-card card">
            <h2 className="section-header-red text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin />
              Your Journey on Map
            </h2>

            {canEdit && hasMissingMapPins && (
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Missing pins detected for some stops.
                  {pinsProgress && (
                    <span className="ml-2 text-gray-500">
                      ({pinsProgress.done}/{pinsProgress.total})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-primary flex items-center gap-2"
                  onClick={handleGenerateMapPins}
                  disabled={pinsGenerating}
                >
                  {pinsGenerating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  {pinsGenerating ? 'Generating Pins…' : 'Generate Map Pins'}
                </button>
              </div>
            )}

            <div className="map-container relative z-0">
              <MapView 
                days={itinerary.days || []} 
                activeDay={activeDay}
                onMarkerClick={(dayIndex) => {
                  setActiveDay(dayIndex);
                  if (dayRefs.current[dayIndex]) {
                    dayRefs.current[dayIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                showRoute={true} 
                height={500} 
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                <span>Start</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                <span>End</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
                <span>Day Markers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-8 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3B82F6' }}></span>
                <span>Route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(itinerary?.createdByRole === 'guide' || itinerary?.ownerId?.role === 'guide') && (
            <div className="view-itinerary-card card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageCircle size={18} />
                Contact Guide
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {itinerary.ownerId?.profile
                        ? `${itinerary.ownerId.profile.firstName || ''} ${itinerary.ownerId.profile.lastName || ''}`.trim()
                        : itinerary.ownerId?.username || 'Guide'}
                    </p>
                    {itinerary.destination && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={14} />
                        {itinerary.destination}
                      </p>
                    )}
                  </div>
                  {itinerary.ownerId?._id && (
                    <Link to={`/guides/${itinerary.ownerId._id}`} className="btn-secondary">
                      View Profile
                    </Link>
                  )}
                </div>

                {(itinerary.pricing?.amount || itinerary.pricing?.contactForPrice || itinerary.pricing?.notes) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    {itinerary.pricing?.amount && (
                      <p className="text-sm text-gray-900">
                        Price: {itinerary.pricing.currency || ''} {itinerary.pricing.amount}
                      </p>
                    )}
                    {itinerary.pricing?.contactForPrice && (
                      <p className="text-sm text-gray-700">Contact for price</p>
                    )}
                    {itinerary.pricing?.notes && (
                      <p className="text-xs text-gray-600 mt-1">{itinerary.pricing.notes}</p>
                    )}
                  </div>
                )}

                {(() => {
                  const cm = itinerary.ownerId?.guideInfo?.contactMethods || {};
                  const items = [
                    cm.phone ? { label: 'Phone', href: `tel:${cm.phone}` } : null,
                    cm.email ? { label: 'Email', href: `mailto:${cm.email}` } : null,
                    cm.whatsapp ? { label: 'WhatsApp', href: `https://wa.me/${String(cm.whatsapp).replace(/\D/g, '')}` } : null,
                    cm.website ? { label: 'Website', href: cm.website } : null,
                    cm.facebook ? { label: 'Facebook', href: cm.facebook } : null,
                    cm.instagram ? { label: 'Instagram', href: cm.instagram } : null,
                  ].filter(Boolean);

                  if (items.length === 0) {
                    return <p className="text-sm text-gray-600">No contact details provided.</p>;
                  }

                  return (
                    <div className="grid gap-2">
                      {items.map((i) => (
                        <a
                          key={i.label}
                          href={i.href}
                          target={i.href?.startsWith('http') ? '_blank' : undefined}
                          rel={i.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="btn-secondary justify-center text-center"
                        >
                          {i.label}
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Budget Tracker */}
          {itinerary.budget && (
            <BudgetTracker 
              budgetTotal={itinerary.budget.total || 0}
              currency={itinerary.budget.currency || 'USD'}
              expenses={itinerary.budget.expenses || []}
              onExpensesChange={handleExpensesChange}
              days={itinerary.days || []}
              collaborators={itinerary.collaborators}
            />
          )}

          {/* Collaborators */}
          <CollaboratorsList
            collaborators={itinerary.collaborators || []}
            ownerId={normalizeId(itinerary.ownerId)}
            isOwner={isOwner}
            onRemove={handleRemoveCollaborator}
          />

          <div className="view-itinerary-card card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Collaboration Activity</h3>
              {activityLog.length > 0 && (
                <span className="text-xs text-gray-500">{activityLog.length} updates</span>
              )}
            </div>

            {canCollaborate && (
              <form onSubmit={handleSubmitActivity} className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    className="input"
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value)}
                  >
                    <option value="comment">Comment</option>
                    <option value="suggestion">Suggestion</option>
                  </select>
                  <span className="text-xs text-gray-500">
                    Collaborators see this instantly
                  </span>
                </div>
                <textarea
                  value={activityMessage}
                  onChange={(event) => setActivityMessage(event.target.value)}
                  placeholder="Share feedback, ask a question, or suggest a change"
                  className="input min-h-[80px]"
                  maxLength={280}
                />
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-gray-400">{activityMessage.length}/280</span>
                  <button
                    type="submit"
                    className="btn btn-primary inline-flex items-center gap-2"
                    disabled={activitySubmitting || !activityMessage.trim()}
                  >
                    {activitySubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Share
                  </button>
                </div>
              </form>
            )}

            <div className="grid max-h-72 gap-3 overflow-y-auto pr-1">
              {activityLog.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {canCollaborate
                    ? 'No updates yet. Be the first to leave a note for the team.'
                    : 'No collaboration activity recorded yet.'}
                </p>
              ) : (
                activityLog.map((entry, index) => {
                  const entryKey = entry._id || `${entry.type}-${entry.createdAt}-${index}`;
                  const typeLabel =
                    entry.type === 'suggestion'
                      ? 'Suggestion'
                      : entry.type === 'comment'
                        ? 'Comment'
                        : 'Update';
                  const iconClass =
                    entry.type === 'suggestion'
                      ? 'text-amber-500'
                      : entry.type === 'comment'
                        ? 'text-blue-500'
                        : 'text-purple-500';
                  const badgeClass =
                    entry.type === 'suggestion'
                      ? 'activity-badge-suggestion'
                      : entry.type === 'comment'
                        ? 'activity-badge-comment'
                        : 'bg-purple-50 text-purple-700';

                  const icon =
                    entry.type === 'suggestion' ? (
                      <Lightbulb className={`h-4 w-4 ${iconClass}`} />
                    ) : entry.type === 'comment' ? (
                      <MessageCircle className={`h-4 w-4 ${iconClass}`} />
                    ) : (
                      <History className={`h-4 w-4 ${iconClass}`} />
                    );

                  return (
                    <div key={entryKey} className="activity-item rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          {icon}
                          <span className={`rounded-full px-2 py-0.5 font-medium ${badgeClass}`}>
                            {typeLabel}
                          </span>
                        </div>
                        <span>{formatActivityRelativeTime(entry.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{entry.message}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        — {resolveUserLabel(entry.createdBy)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Completeness Score */}
          {itinerary.completeness !== undefined && (
            <div className="view-itinerary-card card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Completeness</h3>
              <div className="text-center completeness-circle">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - itinerary.completeness / 100)}`}
                      className="text-red-600 transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold text-gray-900">
                    {itinerary.completeness}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Keep adding details to reach 100%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Day Modal */}
      <AddDayModal
        isOpen={showAddDayModal}
        onClose={() => setShowAddDayModal(false)}
        onSave={handleSaveDay}
        dayNumber={(itinerary?.days?.length || 0) + 1}
      />

      {/* Edit Day Modal */}
      {showEditDayModal && (
        <AddDayModal
          isOpen={showEditDayModal}
          onClose={() => { setShowEditDayModal(false); setEditingDayIndex(null); setAutoOpenAddStop(false); }}
          onSave={handleUpdateDay}
          existingDay={editingDayIndex != null ? itinerary.days[editingDayIndex] : null}
          dayNumber={(editingDayIndex ?? 0) + 1}
          autoOpenAddStop={autoOpenAddStop}
        />
      )}
    </div>
  );
}
