import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MapPin, User, LogOut } from 'lucide-react';
import AdminNav from './AdminNav';
import GuideNav from './GuideNav';
import UserNav from './UserNav';
import NotificationBell from './NotificationBell';

const Layout = () => {
  const { user, token, logout, getCurrentUser } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    logout: state.logout,
    getCurrentUser: state.getCurrentUser,
  }));
  const location = useLocation();

  useEffect(() => {
    if (token) {
      getCurrentUser();
    }
  }, [token, getCurrentUser]);

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
              <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'guide' ? '/guide' : '/home'} className="flex items-center gap-2">
                <MapPin className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Travel Heaven</span>
              </Link>

              <nav className="hidden md:flex gap-4">
                {user?.role === 'admin' && <AdminNav />}
                {user?.role === 'guide' && <GuideNav />}
                {user?.role === 'user' && <UserNav />}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />

              <Link to="/profile" className={navLinkClass('/profile')}>
                {user?.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.username}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>Profile</span>
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
