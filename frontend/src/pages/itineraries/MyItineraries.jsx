import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, Globe, Lock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

/**
 * MyItineraries Page - Display user's created and collaborated itineraries
 * Design Pattern: Repository Pattern - Fetches data through API abstraction
 */
export default function MyItineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const response = await api.get('/itineraries/my');
      setItineraries(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load itineraries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || badges.planning;
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Itineraries</h1>
          <p className="text-gray-600 mt-1">Plan and manage your travel adventures</p>
        </div>
        <Link
          to="/itineraries/create"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Trip
        </Link>
      </div>

      {/* Itineraries Grid */}
      {itineraries.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No itineraries yet</h3>
          <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
          <Link to="/itineraries/create" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => {
            const totalStops = itinerary.days?.reduce((sum, day) => sum + (day.stops?.length || 0), 0) || 0;
            
            return (
              <Link
                key={itinerary._id}
                to={`/itineraries/${itinerary._id}`}
                className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">
                    {itinerary.title}
                  </h3>
                  {itinerary.isPublic ? (
                    <Globe size={20} className="text-blue-600 flex-shrink-0 ml-2" title="Public" />
                  ) : (
                    <Lock size={20} className="text-gray-400 flex-shrink-0 ml-2" title="Private" />
                  )}
                </div>

                {/* Description */}
                {itinerary.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {itinerary.description}
                  </p>
                )}

                {/* Dates */}
                {itinerary.startDate && itinerary.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar size={16} />
                    <span>{formatDateRange(itinerary.startDate, itinerary.endDate)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{calculateDays(itinerary.startDate, itinerary.endDate)} days</span>
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{totalStops} stops</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{itinerary.collaborators?.length || 0} people</span>
                  </div>
                  {itinerary.completeness !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      <span>{itinerary.completeness}%</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(itinerary.status)}`}>
                    {itinerary.status}
                  </span>
                  
                  {/* Completeness Progress */}
                  {itinerary.completeness !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${itinerary.completeness}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
