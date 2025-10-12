import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, 
  MapPin, 
  Hotel, 
  Bus, 
  User, 
  LogOut, 
  Shield, 
  Briefcase,
  Calendar
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <MapPin className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Travel Heaven</span>
              </Link>

              <nav className="hidden md:flex gap-4">
                <Link to="/" className={navLinkClass('/')}>
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <Link to="/locations" className={navLinkClass('/locations')}>
                  <MapPin className="w-4 h-4" />
                  Locations
                </Link>
                <Link to="/hotels" className={navLinkClass('/hotels')}>
                  <Hotel className="w-4 h-4" />
                  Hotels
                </Link>
                <Link to="/transportation" className={navLinkClass('/transportation')}>
                  <Bus className="w-4 h-4" />
                  Transportation
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Role-specific navigation */}
              {user?.role === 'admin' && (
                <Link to="/admin" className={navLinkClass('/admin')}>
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}

              {user?.role === 'guide' && (
                <Link to="/guide" className={navLinkClass('/guide')}>
                  <Briefcase className="w-4 h-4" />
                  Guide Dashboard
                </Link>
              )}

              {user?.role === 'user' && (
                <Link to="/bookings" className={navLinkClass('/bookings')}>
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
              )}

              <Link to="/profile" className={navLinkClass('/profile')}>
                <User className="w-4 h-4" />
                Profile
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            © 2025 Travel Heaven. Tourist Helper System with SDP Patterns.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
