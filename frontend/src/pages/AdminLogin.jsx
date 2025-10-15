import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Shield, MapPin } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      // Get the user from store after login
      const currentUser = useAuthStore.getState().user;
      
      // Verify it's an admin account
      if (currentUser?.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        await useAuthStore.getState().logout();
        return;
      }
      
      toast.success('Admin login successful!');
      navigate('/admin');
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">System Administration Access</p>
        </div>

        <div className="card">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-800 text-center">
              🔒 Admin credentials required
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="admin@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="Enter admin password"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Shield className="w-4 h-4" />
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Link 
              to="/" 
              className="text-center block text-gray-600 hover:text-gray-800"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
