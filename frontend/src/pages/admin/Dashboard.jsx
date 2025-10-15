import { Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Clock, MapPin, Hotel, Bus, Users, Eye } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Admin Header - BIG DOMAIN */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Shield className="w-12 h-12" />
          <div>
            <h1 className="text-4xl font-bold">Admin Control Center</h1>
            <p className="text-red-100 text-lg">Complete System Management & Oversight</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/approvals" className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <h3 className="font-bold text-lg">Pending Approvals</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">--</p>
          <p className="text-sm text-gray-600">Locations, Hotels, Transport</p>
        </Link>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="font-bold text-lg">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">--</p>
          <p className="text-sm text-gray-600">Total approved items</p>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <h3 className="font-bold text-lg">Rejected</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">--</p>
          <p className="text-sm text-gray-600">Total rejected items</p>
        </div>

        <Link to="/guides" className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h3 className="font-bold text-lg">Total Guides</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">--</p>
          <p className="text-sm text-gray-600">Registered guides</p>
        </Link>
      </div>

      {/* Content Overview */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Eye className="w-6 h-6 text-primary-600" />
          Content Overview
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/locations" className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold">Locations</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">--</p>
            <p className="text-sm text-gray-600 mt-1">View all locations</p>
          </Link>

          <Link to="/hotels" className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Hotel className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold">Hotels</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">--</p>
            <p className="text-sm text-gray-600 mt-1">View all hotels</p>
          </Link>

          <Link to="/transportation" className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold">Transportation</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">--</p>
            <p className="text-sm text-gray-600 mt-1">View all transport</p>
          </Link>
        </div>
      </div>

      {/* Admin Powers */}
      <div className="card bg-gradient-to-r from-gray-50 to-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          Admin Privileges & Controls
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Approval Powers:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Approve or reject location submissions</li>
              <li>Approve or reject hotel listings</li>
              <li>Approve or reject transportation options</li>
              <li>Provide rejection reasons with feedback</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Management Powers:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>View all user activities and submissions</li>
              <li>Monitor guide profiles and ratings</li>
              <li>Access complete system statistics</li>
              <li>Oversee all reviews and ratings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link to="/admin/approvals" className="btn btn-primary text-center">
            Review Approvals
          </Link>
          <Link to="/locations" className="btn btn-secondary text-center">
            Manage Locations
          </Link>
          <Link to="/hotels" className="btn btn-secondary text-center">
            Manage Hotels
          </Link>
          <Link to="/guides" className="btn btn-secondary text-center">
            Manage Guides
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
