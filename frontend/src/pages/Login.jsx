import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      // If authenticated and user is admin, prefer admin dashboard
      if (user?.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
        return;
      }
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      // If API returned the user object, redirect admins to admin dashboard
      const loggedUser = result.user || user;
      if (loggedUser?.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  // Quick dev helper: login as demo admin
  const handleDemoAdminLogin = async () => {
    console.log('Demo admin button clicked');
    toast.dismiss();
    const loader = toast.loading('Signing in as demo admin...');
    // Example/demo admin credentials — replace with your dev admin creds
    const demoEmail = 'admin@example.com';
    const demoPassword = 'password123';
    const demoName = 'Demo Admin';

    try {
      // Ensure demo admin exists (dev-only endpoint)
      try {
        await apiService.createDemoAdmin(demoEmail, demoPassword, demoName);
      } catch (createErr) {
        console.warn('createDemoAdmin failed:', createErr?.response?.data || createErr.message || createErr);
      }

      const result = await login(demoEmail, demoPassword);
      if (result && result.success) {
        const loggedUser = result.user || user;
        if (loggedUser?.role === 'admin') {
          navigate('/dashboard/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
        toast.success('Signed in as demo admin', { id: loader });
      } else {
        toast.error('Demo admin login failed', { id: loader });
      }
    } catch (err) {
      console.error('Demo admin login error', err);
      toast.error('Demo admin login error', { id: loader });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
            
            {/* demo admin button moved outside form to avoid accidental form-overlay blocking clicks */}
          </form>

          {/* Dev helper: quick admin signin (hidden in production) */}
          {import.meta?.env?.MODE !== 'production' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                onMouseDown={handleDemoAdminLogin}
                disabled={loading}
                aria-label="Sign in as demo admin"
                className={`relative z-10 pointer-events-auto w-full flex items-center justify-center space-x-3 py-2 rounded-xl text-sm font-medium shadow-md transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading
                    ? 'opacity-60 cursor-not-allowed bg-indigo-400'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]'
                } text-white`}
              >
                <ShieldCheckIcon className="h-5 w-5 text-white opacity-95" />
                <span>{loading ? 'Signing in...' : 'Sign in as Admin '}</span>
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-qwipo-primary hover:text-qwipo-secondary font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Demo Credentials:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Email:</strong> rajesh@grocery.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
