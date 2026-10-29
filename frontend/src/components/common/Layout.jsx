import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  SparklesIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentChartBarIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const showBusinessHeader = location.pathname.startsWith('/dashboard/products');

  const businessHeaderTabs = [
    { key: 'all', label: 'All Products', icon: '🛍️' },
    { key: 'fashion', label: 'Fashion', icon: '👗' },
    { key: 'grocery', label: 'Grocery Store', icon: '🛒' },
    { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  ];

  const activeBt = new URLSearchParams(location.search).get('bt') || 'all';

  const cartItemCount = cartItems?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Show a reduced navigation for admin users (only Analytics & Reports)
  const normalNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
    { name: 'Orders', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
    { name: 'ML Recommendations', href: '/dashboard/recommendations', icon: SparklesIcon },
    { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: LightBulbIcon },
    // analytics and reports are admin-only and intentionally omitted from normal navigation
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  ];

  const adminNavigation = [
    // Admin Dashboard should point to the admin landing page
    { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
    { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
  ];

  // If user is admin OR we're currently on an admin route, prefer the admin navigation.
  const navigation = (user?.role === 'admin' || location.pathname.startsWith('/dashboard/admin'))
    ? adminNavigation
    : normalNavigation;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
  <div className={`fixed inset-y-0 left-0 z-50 w-48 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ height: '100vh' }}>
  <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-qwipo-primary">SmartRetail</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-qwipo-primary text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-gray-200 flex-shrink-0">
          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-3 py-2.5 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-48">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center min-w-0">
              {showBusinessHeader ? (
                <div className="flex items-center gap-2 overflow-x-auto pr-4">
                  {businessHeaderTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => navigate(`/dashboard/products${tab.key === 'all' ? '' : `?bt=${tab.key}`}`)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-all ${
                        (activeBt === tab.key)
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                      aria-label={`Filter by ${tab.label}`}
                    >
                      <span className="mr-1">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900 lg:hidden">SmartRetail</h1>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-md transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors"
                title="Notifications"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors"
                title="Cart"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-qwipo-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* User Profile Section */}
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="flex items-center space-x-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                title="View Profile"
              >
                <div className="w-8 h-8 bg-qwipo-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.businessType || 'Business'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-4">
          <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;