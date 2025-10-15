import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { LogIn, MapPin } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuthStore();
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
      toast.success('Login successful!');
      
      // Redirect based on user role
      const userRole = result.user?.role || user?.role;
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'guide') {
        navigate('/guide');
      } else {
        navigate('/home');
      }
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MapPin className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Travel Heaven</h1>
          <p className="text-gray-600 mt-2">Your Tourist Helper</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
          <p className="text-center text-gray-600 mb-6 text-sm">
            For Users, Guides, and Admins
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="input"
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
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
