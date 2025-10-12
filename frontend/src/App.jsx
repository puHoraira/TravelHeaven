import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Locations from './pages/Locations';
import Hotels from './pages/Hotels';
import Transportation from './pages/Transportation';
import Profile from './pages/Profile';

// Role-specific pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/Approvals';

import GuideDashboard from './pages/guide/Dashboard';
import GuideLocations from './pages/guide/Locations';
import GuideHotels from './pages/guide/Hotels';
import GuideTransport from './pages/guide/Transport';

import UserBookings from './pages/user/Bookings';

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="locations" element={<Locations />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="transportation" element={<Transportation />} />
          <Route path="profile" element={<Profile />} />

          {/* Admin routes */}
          <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/approvals" element={<ProtectedRoute requiredRole="admin"><AdminApprovals /></ProtectedRoute>} />

          {/* Guide routes */}
          <Route path="guide" element={<ProtectedRoute requiredRole="guide"><GuideDashboard /></ProtectedRoute>} />
          <Route path="guide/locations" element={<ProtectedRoute requiredRole="guide"><GuideLocations /></ProtectedRoute>} />
          <Route path="guide/hotels" element={<ProtectedRoute requiredRole="guide"><GuideHotels /></ProtectedRoute>} />
          <Route path="guide/transport" element={<ProtectedRoute requiredRole="guide"><GuideTransport /></ProtectedRoute>} />

          {/* User routes */}
          <Route path="bookings" element={<ProtectedRoute requiredRole="user"><UserBookings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
