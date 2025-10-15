import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import 'leaflet/dist/leaflet.css';

// Layouts
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import UserLogin from './pages/UserLogin';
import GuideLogin from './pages/GuideLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import GuideRegister from './pages/GuideRegister';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Locations from './pages/Locations';
import Hotels from './pages/Hotels';
import Transportation from './pages/Transportation';
import Profile from './pages/Profile';
import Guides from './pages/Guides';
import GuideProfile from './pages/GuideProfile';

// Role-specific pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/Approvals';
import GuideVerifications from './pages/admin/GuideVerifications';

import GuideDashboard from './pages/guide/Dashboard';
import GuideLocations from './pages/guide/Locations';
import GuideHotels from './pages/guide/Hotels';
import GuideTransport from './pages/guide/Transport';

import UserBookings from './pages/user/Bookings';

// Itinerary pages
import MyItineraries from './pages/itineraries/MyItineraries';
import PublicItineraries from './pages/itineraries/PublicItineraries';
import CreateItinerary from './pages/itineraries/CreateItinerary';
import ViewItinerary from './pages/itineraries/ViewItinerary';

function App() {
  const { user } = useAuthStore();

  // Redirect after login based on role
  const getRedirectPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'guide') return '/guide';
    return '/home';
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Landing Page - For NON-SIGNED users */}
        <Route path="/" element={!user ? <Landing /> : <Navigate to={getRedirectPath()} />} />
        
        {/* THREE SEPARATE LOGIN PAGES */}
        <Route path="/login" element={!user ? <UserLogin /> : <Navigate to={getRedirectPath()} />} />
        <Route path="/guide/login" element={!user ? <GuideLogin /> : <Navigate to={getRedirectPath()} />} />
        <Route path="/admin/login" element={!user ? <AdminLogin /> : <Navigate to={getRedirectPath()} />} />
        
        {/* TWO SEPARATE REGISTRATION PAGES */}
        <Route path="/register" element={!user ? <Register /> : <Navigate to={getRedirectPath()} />} />
        <Route path="/guide/register" element={!user ? <GuideRegister /> : <Navigate to={getRedirectPath()} />} />

        {/* Protected routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* User Home */}
          <Route path="/home" element={<ProtectedRoute requiredRole="user"><Home /></ProtectedRoute>} />
          
          {/* Common routes - All authenticated users */}
          <Route path="/locations" element={<Locations />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/transportation" element={<Transportation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<GuideProfile />} />

          {/* Admin Dashboard - BIG DOMAIN for control */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute requiredRole="admin"><AdminApprovals /></ProtectedRoute>} />
          <Route path="/admin/guide-verifications" element={<ProtectedRoute requiredRole="admin"><GuideVerifications /></ProtectedRoute>} />

          {/* Guide Dashboard */}
          <Route path="/guide" element={<ProtectedRoute requiredRole="guide"><GuideDashboard /></ProtectedRoute>} />
          <Route path="/guide/locations" element={<ProtectedRoute requiredRole="guide"><GuideLocations /></ProtectedRoute>} />
          <Route path="/guide/hotels" element={<ProtectedRoute requiredRole="guide"><GuideHotels /></ProtectedRoute>} />
          <Route path="/guide/transport" element={<ProtectedRoute requiredRole="guide"><GuideTransport /></ProtectedRoute>} />

          {/* User Bookings */}
          <Route path="/bookings" element={<ProtectedRoute requiredRole="user"><UserBookings /></ProtectedRoute>} />

          {/* Itinerary routes - All authenticated users */}
          <Route path="/itineraries" element={<MyItineraries />} />
          <Route path="/itineraries/public" element={<PublicItineraries />} />
          <Route path="/itineraries/create" element={<CreateItinerary />} />
          <Route path="/itineraries/:id" element={<ViewItinerary />} />
          <Route path="/itineraries/:id/view" element={<ViewItinerary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
