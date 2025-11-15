import { Bus, Hotel, MapPin, Sparkles, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Home.css';

const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-section-red bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Travel Heaven, {user?.profile?.firstName || user?.username}!
        </h1>
        <p className="text-xl opacity-90">
          {user?.role === 'admin' && 'Manage approvals and oversee all activities'}
          {user?.role === 'guide' && 'Share amazing locations with travelers'}
          {user?.role === 'user' && 'Discover and book your next adventure'}
        </p>
      </div>

      {/* Stats/Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Locations</h3>
              <p className="text-sm text-gray-600">Discover destinations</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Hotel className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Hotels</h3>
              <p className="text-sm text-gray-600">Find accommodation</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Transportation</h3>
              <p className="text-sm text-gray-600">Travel with ease</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Community</h3>
              <p className="text-sm text-gray-600">Join travelers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific information */}
      <div className="info-card card">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-primary-600 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {user?.role === 'admin' && 'Admin Dashboard'}
              {user?.role === 'guide' && 'Guide Dashboard'}
              {user?.role === 'user' && 'Start Your Journey'}
            </h2>

            {user?.role === 'admin' && (
              <div className="space-y-2">
                <p className="text-gray-600">As an admin, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Review and approve guide submissions</li>
                  <li>Manage locations, hotels, and transportation</li>
                  <li>View system statistics and reports</li>
                  <li>Oversee all user activities</li>
                </ul>
              </div>
            )}

            {user?.role === 'guide' && (
              <div className="space-y-2">
                <p className="text-gray-600">As a guide, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Add new tourist locations with images</li>
                  <li>List hotels for each location</li>
                  <li>Add transportation options</li>
                  <li>Track approval status of your submissions</li>
                </ul>
              </div>
            )}

            {user?.role === 'user' && (
              <div className="space-y-2">
                <p className="text-gray-600">As a tourist, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Browse approved locations and destinations</li>
                  <li>Find hotels and accommodations</li>
                  <li>Check transportation options</li>
                  <li>Book services for your trip</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {user?.role === 'guide' && (
            <>
              <a href="/guide/locations" className="btn btn-primary text-center">
                Add Location
              </a>
              <a href="/guide/hotels" className="btn btn-primary text-center">
                Add Hotel
              </a>
              <a href="/guide/transport" className="btn btn-primary text-center">
                Add Transport
              </a>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <a href="/locations" className="btn btn-primary text-center">
                Browse Locations
              </a>
              <a href="/hotels" className="btn btn-primary text-center">
                Find Hotels
              </a>
              <a href="/transportation" className="btn btn-primary text-center">
                View Transport
              </a>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <a href="/admin/approvals" className="btn btn-primary text-center">
                Pending Approvals
              </a>
              <a href="/admin" className="btn btn-primary text-center">
                View Statistics
              </a>
              <a href="/locations" className="btn btn-secondary text-center">
                Browse All
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
