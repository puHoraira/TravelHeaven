import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { User, MapPin } from 'lucide-react';

const UserLogin = () => {
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
      
      // Verify it's a regular user account
      if (currentUser?.role !== 'user') {
        toast.error('Access denied. Tourist credentials required.');
        await useAuthStore.getState().logout();
        return;
      }
      
      toast.success('Login successful!');
      navigate('/home');
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <User className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Tourist Login</h1>
          <p className="text-gray-600 mt-2">Traveler Access</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">Welcome Back, Traveler!</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
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
                Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
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
              className="btn btn-primary w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4" />
              {isLoading ? 'Logging in...' : 'Login as Tourist'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register Now
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t">
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

export default UserLogin;
