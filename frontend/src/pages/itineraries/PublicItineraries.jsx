import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Eye, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

/**
 * PublicItineraries Page - Browse publicly shared trip plans
 * Design Pattern: Repository Pattern - Data access through API
 */
export default function PublicItineraries() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicItineraries();
  }, []);

  const fetchPublicItineraries = async () => {
    try {
      const response = await api.get('/itineraries/public');
      const items = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
      setItineraries(items);
    } catch (error) {
      console.error('Failed to load public itineraries:', error);
      toast.error(error?.message || 'Failed to load public itineraries');
    } finally {
      setLoading(false);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Public Itineraries</h1>
        <p className="text-gray-600 mt-1">
          Explore trip plans shared by the community
        </p>
      </div>

      {/* Itineraries Grid */}
      {itineraries.length === 0 ? (
        <div className="card text-center py-12">
          <Eye size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No public itineraries yet</h3>
          <p className="text-gray-600">Check back later for community shared trips!</p>
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
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-2">
                    {itinerary.title}
                  </h3>
                  
                  {/* Owner Info */}
                  {itinerary.ownerId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {itinerary.ownerId.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span>by {itinerary.ownerId.name || 'Anonymous'}</span>
                    </div>
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

                {/* Completeness Progress */}
                {itinerary.completeness !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${itinerary.completeness}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {itinerary.completeness}%
                    </span>
                  </div>
                )}

                {/* View Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    <Eye size={16} />
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
