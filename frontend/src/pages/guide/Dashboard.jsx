import { Briefcase, Bus, CheckCircle, Clock, Hotel, MapPin, ShieldAlert, Star, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import './Dashboard.css';

const GuideDashboard = () => {
  const { user } = useAuthStore();
  const verificationStatus = user?.guideInfo?.verificationStatus || 'pending';
  const isApproved = verificationStatus === 'approved';
  const [metrics, setMetrics] = useState({
    submissions: { pending: 0, approved: 0, rejected: 0 },
    breakdown: {
      locations: { pending: 0, approved: 0, rejected: 0 },
      hotels: { pending: 0, approved: 0, rejected: 0 },
      transport: { pending: 0, approved: 0, rejected: 0 },
    },
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      if (!user || user.role !== 'guide') {
        return;
      }

      setLoadingMetrics(true);
      setMetricsError(null);
      try {
  // NOTE: API route is mounted at /api/guides in the backend (plural)
  const response = await api.get('/guides/metrics');
        if (isMounted && response.success) {
          setMetrics(response.data);
        }
      } catch (error) {
        if (isMounted) {
          setMetricsError(error?.message || 'Failed to load submission metrics');
        }
      } finally {
        if (isMounted) {
          setLoadingMetrics(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const statusCopy = useMemo(() => {
    if (isApproved) {
      return {
        tone: 'bg-green-50 border border-green-100 text-green-700',
        title: 'Approved Guide',
        subtitle: 'Your listings are visible to travelers.',
      };
    }

    if (verificationStatus === 'rejected') {
      return {
        tone: 'bg-red-50 border border-red-100 text-red-700',
        title: 'Verification Rejected',
        subtitle: user?.guideInfo?.rejectionReason || 'Update your documents and re-submit for review.',
      };
    }

    return {
      tone: 'bg-yellow-50 border border-yellow-100 text-yellow-700',
      title: 'Awaiting Admin Approval',
      subtitle: 'Once approved, travelers can discover you and your submissions.',
    };
  }, [isApproved, verificationStatus, user?.guideInfo?.rejectionReason]);

  const handleRestrictedAction = () => {
    toast.error('Admin approval required before posting new listings.');
  };

  const ActionLink = ({ to, children }) => {
    if (isApproved) {
      return (
        <Link to={to} className="btn btn-primary text-center">
          {children}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={handleRestrictedAction}
        className="btn btn-secondary text-center cursor-not-allowed opacity-70"
      >
        {children}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Guide Header */}
      <div className="dashboard-header rounded-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Briefcase className="w-12 h-12" />
          <div>
            <h1 className="dashboard-title text-4xl font-bold">Guide Dashboard</h1>
            <p className="text-white text-opacity-90 text-lg">Share Your Expertise with Travelers</p>
          </div>
        </div>
      </div>

      <div className={`flex items-start gap-3 rounded-lg p-4 ${
        isApproved ? 'status-alert-approved' :
        verificationStatus === 'rejected' ? 'status-alert-rejected' :
        'status-alert-pending'
      }`}>
        <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold">{statusCopy.title}</h2>
          <p className="text-sm opacity-90">{statusCopy.subtitle}</p>
        </div>
      </div>

      {/* Submission Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="metric-card card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <h3 className="font-bold">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">
            {metrics.submissions.pending}
          </p>
          <p className="text-sm text-gray-600">
            Awaiting approval
            {loadingMetrics ? ' • Updating…' : ''}
          </p>
          {metricsError && (
            <p className="text-xs text-red-600 mt-1">{metricsError}</p>
          )}
        </div>

        <div className="metric-card card">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="font-bold">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {metrics.submissions.approved}
          </p>
          <p className="text-sm text-gray-600">Live submissions</p>
        </div>

        <div className="metric-card card">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <h3 className="font-bold">Rejected</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">
            {metrics.submissions.rejected}
          </p>
          <p className="text-sm text-gray-600">Needs revision</p>
        </div>

        <div className="metric-card card">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-blue-600" />
            <h3 className="font-bold">Rating</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {user?.guideInfo?.rating?.average?.toFixed?.(1) ?? '0.0'}
          </p>
          <p className="text-sm text-gray-600">
            Based on {user?.guideInfo?.rating?.count ?? 0} reviews
          </p>
        </div>
      </div>

      {/* Content Management */}
      <div className="content-card card">
        <h2 className="section-header text-xl font-bold mb-4">Your Content</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/guide/locations" className="content-card p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 icon-red" />
              <h3 className="font-semibold">My Locations</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.breakdown.locations.approved}
              <span className="text-sm text-gray-500 font-normal ml-2">
                {metrics.breakdown.locations.pending} pending
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">Manage your locations</p>
          </Link>

          <Link to="/guide/hotels" className="content-card p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Hotel className="w-6 h-6 icon-red" />
              <h3 className="font-semibold">My Hotels</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {metrics.breakdown.hotels.approved}
              <span className="text-sm text-gray-500 font-normal ml-2">
                {metrics.breakdown.hotels.pending} pending
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">Manage your hotels</p>
          </Link>

          <Link to="/guide/transport" className="content-card p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="w-6 h-6 icon-red" />
              <h3 className="font-semibold">My Transport</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.breakdown.transport.approved}
              <span className="text-sm text-gray-500 font-normal ml-2">
                {metrics.breakdown.transport.pending} pending
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">Manage transport options</p>
          </Link>
        </div>
      </div>

      {/* Guide Capabilities */}
      <div className="content-card card">
        <h2 className="section-header text-xl font-bold mb-4 flex items-center gap-2">
          <Briefcase className="w-6 h-6 icon-red" />
          What You Can Do
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Add Content:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Submit new tourist locations with photos</li>
              <li>Add hotel listings with details</li>
              <li>List transportation options</li>
              <li>Include pricing and contact info</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Track Performance:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Monitor approval status of submissions</li>
              <li>View your guide rating and reviews</li>
              <li>See which content is most popular</li>
              <li>Respond to user feedback</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="content-card card">
        <h2 className="section-header text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionLink to="/guide/locations">Add New Location</ActionLink>
          <ActionLink to="/guide/hotels">Add New Hotel</ActionLink>
          <ActionLink to="/guide/transport">Add Transportation</ActionLink>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;
