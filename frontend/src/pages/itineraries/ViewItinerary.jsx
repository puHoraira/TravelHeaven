import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Share2, Users, DollarSign, Calendar, 
  MapPin, Globe, Lock, Trash2, Plus, Save 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import MapView from '../../components/itinerary/MapView';
import DayCard from '../../components/itinerary/DayCard';
import CollaboratorsList from '../../components/itinerary/CollaboratorsList';
import BudgetTracker from '../../components/itinerary/BudgetTracker';

/**
 * ViewItinerary Page - Display and edit itinerary details with map
 * Design Patterns: 
 * - Observer Pattern: Updates propagate to collaborators
 * - Strategy Pattern: Different views for owner/collaborator/public
 */
export default function ViewItinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const response = await api.get(`/itineraries/${id}`);
      setItinerary(response.data.data);
      setEditForm({
        title: response.data.data.title,
        description: response.data.data.description,
        isPublic: response.data.data.isPublic,
      });
    } catch (error) {
      toast.error('Failed to load itinerary');
      console.error(error);
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user && itinerary && user.id === itinerary.ownerId?._id;
  const canEdit = isOwner || itinerary?.collaborators?.some(
    c => c.userId?._id === user?.id && c.permission === 'edit'
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
      await api.delete(`/itineraries/${id}/collaborators/${userId}`);
      toast.success('Collaborator removed');
      fetchItinerary();
    } catch (error) {
      toast.error('Failed to remove collaborator');
      console.error(error);
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
      <Link to="/itineraries" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
        <ArrowLeft size={20} />
        Back to My Itineraries
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card">
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
                      <h1 className="text-3xl font-bold text-gray-900">{itinerary.title}</h1>
                      {itinerary.isPublic ? (
                        <Globe className="text-blue-600" title="Public" />
                      ) : (
                        <Lock className="text-gray-400" title="Private" />
                      )}
                    </div>
                    {itinerary.description && (
                      <p className="text-gray-600">{itinerary.description}</p>
                    )}
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(true)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
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
                  )}
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    itinerary.status === 'active' ? 'bg-green-100 text-green-800' :
                    itinerary.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {itinerary.status}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Map View */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Trip Map
            </h2>
            <MapView stops={allStops} showRoute={true} height={500} />
          </div>

          {/* Days */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Day by Day</h2>
              {canEdit && (
                <button className="btn-secondary flex items-center gap-2">
                  <Plus size={16} />
                  Add Day
                </button>
              )}
            </div>
            
            {itinerary.days && itinerary.days.length > 0 ? (
              <div className="space-y-4">
                {itinerary.days.map((day, index) => (
                  <DayCard
                    key={day._id || index}
                    day={day}
                    dayNumber={index + 1}
                    editable={canEdit}
                  />
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
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Budget Tracker */}
          {itinerary.budget && (
            <BudgetTracker 
              budget={itinerary.budget} 
              collaborators={itinerary.collaborators}
            />
          )}

          {/* Collaborators */}
          <CollaboratorsList
            collaborators={itinerary.collaborators || []}
            ownerId={itinerary.ownerId?._id}
            isOwner={isOwner}
            onRemove={handleRemoveCollaborator}
          />

          {/* Completeness Score */}
          {itinerary.completeness !== undefined && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Completeness</h3>
              <div className="text-center">
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
                      className="text-blue-600 transition-all duration-1000"
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
    </div>
  );
}
