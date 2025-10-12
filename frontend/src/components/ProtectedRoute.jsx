import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Protected Route Component
 * Implements Authorization Strategy Pattern
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
