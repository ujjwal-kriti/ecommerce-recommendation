import React, { useState, useEffect } from 'react';
import {
  CubeIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon, // used in the Recent Activity section
  ArrowRightIcon, // used in the Recommendations section
  ExclamationTriangleIcon, // used in the error handling section
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  // Business insights removed per request - we will not fetch or render BI content
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const now = Date.now();
    const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes cache
    
    if ((now - lastFetchTime > CACHE_TIMEOUT || !dashboardData) && !isFetching) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchDashboardData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastFetchTime, dashboardData]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (apiCall, maxRetries = 1) => { // Reduced retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        return result;
      } catch (error) {
        if (error.response?.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 3000; // Increased delay: 3s, 6s
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
  };

  const fetchDashboardData = async () => {
    if (isFetching) return; // Prevent multiple simultaneous calls
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      // Log API responses for debugging
      const logApiResponse = (name, response) => {
        if (response.status === 'fulfilled') {
          console.log(`${name} API success:`, response.value?.success);
        } else {
          console.log(`${name} API failed:`, response.reason?.message || 'Unknown error');
        }
      };
      
      // Fetch APIs sequentially with delays to avoid rate limiting
  let dashboardResponse, recommendationsResponse;
      
      try {
        console.log('Fetching dashboard data...');
        dashboardResponse = await fetchWithRetry(() => apiService.getDashboardData());
        
        // Small delay between requests
        await sleep(200);
        
        console.log('Fetching recommendations...');
        recommendationsResponse = await fetchWithRetry(() => apiService.getRecommendations('hybrid', 6));
        
        } catch (error) {
        console.error('Error in sequential API calls:', error);
        // Set default values for failed calls
        dashboardResponse = { success: false, data: null };
        recommendationsResponse = { success: false, data: { recommendations: [] } };
        
      }
      
      // Log API responses
  console.log('Dashboard API success:', dashboardResponse?.success);
  console.log('Recommendations API success:', recommendationsResponse?.success);
      
      // Include demo orders from localStorage (created when backend order creation fails)
      const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
      const demoOrdersCount = Array.isArray(demoOrders) ? demoOrders.length : 0;

      // Handle dashboard data
      if (dashboardResponse?.success) {
        // Merge demo orders into metrics and recent activity so demo mode is visible in dashboard
        const data = dashboardResponse.data || {};
        data.metrics = data.metrics || { totalPurchases: 0, totalSpent: 0, averageOrderValue: 0 };
        data.recentActivity = data.recentActivity || { recentPurchases: [] };

        // Add demo orders count to total purchases
        data.metrics.totalPurchases = (data.metrics.totalPurchases || 0) + demoOrdersCount;

        // Append demo orders (flatten items) into recentPurchases
        const demoRecent = [];
        if (Array.isArray(demoOrders)) {
          demoOrders.slice(-5).reverse().forEach(order => {
            (order.items || []).forEach(item => {
              demoRecent.push({
                productId: item.productId || item.product || {},
                quantity: item.quantity || 1,
                price: item.price || (item.productId?.price?.discountedPrice) || 0,
                demo: true,
                createdAt: order.createdAt
              });
            });
          });
        }

        data.recentActivity.recentPurchases = [
          ... (data.recentActivity.recentPurchases || []),
          ...demoRecent
        ].slice(0, 10);

        setDashboardData(data);
      } else {
        // Set fallback dashboard data (include demo orders)
        const recentPurchases = [];
        if (Array.isArray(demoOrders)) {
          demoOrders.slice(-5).reverse().forEach(order => {
            (order.items || []).forEach(item => {
              recentPurchases.push({
                productId: item.productId || item.product || {},
                quantity: item.quantity || 1,
                price: item.price || (item.productId?.price?.discountedPrice) || 0,
                demo: true,
                createdAt: order.createdAt
              });
            });
          });
        }

        setDashboardData({
          metrics: {
            totalPurchases: demoOrdersCount,
            totalSpent: demoOrders.reduce((s, o) => s + (o.totalAmount?.grandTotal || 0), 0) || 0,
            averageOrderValue: demoOrdersCount > 0 ? ((demoOrders.reduce((s, o) => s + (o.totalAmount?.grandTotal || 0), 0) || 0) / demoOrdersCount) : 0
          },
          recentActivity: {
            recentPurchases
          }
        });
      }
      
      // Handle recommendations
      if (recommendationsResponse?.success) {
        setRecommendations(recommendationsResponse.data.recommendations || []);
      } else {
        setRecommendations([]);
      }
      
      // Business insights intentionally not used
      
      setLastFetchTime(Date.now());
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (error.response?.status === 429) {
        setError('Too many requests. The system is being rate limited. Please wait a few minutes before refreshing.');
      } else {
        setError('Failed to load dashboard data. Please check your connection and try again.');
        
        if (retryCount >= 2) {
          setDashboardData({
            metrics: {
              totalPurchases: 0,
              totalSpent: 0,
              averageOrderValue: 0
            },
            recentActivity: {
              recentPurchases: []
            }
          });
          setRecommendations([]);
    // nothing to set for business insights
          setError(null);
        }
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const retryFetch = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    setLastFetchTime(0);
    fetchDashboardData();
  };

  const handleRefresh = () => {
    setLastFetchTime(0);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            Loading dashboard data... {retryCount > 0 && `(Retry ${retryCount})`}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryFetch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors w-full"
            >
              Try Again {retryCount > 0 && `(${retryCount + 1})`}
            </button>
            <p className="text-sm text-gray-500">
              If the problem persists, please wait 5-10 minutes before trying again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Orders',
      value: dashboardData?.metrics?.totalPurchases || 0,
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Total Spent',
      value: formatCurrency(dashboardData?.metrics?.totalSpent || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase',
    },
    {
      name: 'Avg Order Value',
      value: formatCurrency(dashboardData?.metrics?.averageOrderValue || 0),
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      change: '+5%',
      changeType: 'increase',
    },
    {
      name: 'Recommendations',
      value: recommendations.length,
      icon: SparklesIcon,
      color: 'bg-orange-500',
      change: 'New',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                {user?.businessName} • {user?.businessType?.charAt(0).toUpperCase() + user?.businessType?.slice(1)}
              </p>
              <p className="text-blue-200 mt-2 text-sm">
                🤖 Advanced ML algorithms are analyzing your behavior patterns
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => navigate('/dashboard/ai-assistant')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>Ask AI Assistant</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowTrendingUpIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="flex items-center mt-2">
                    {stat.changeType !== 'neutral' && (
                      <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
                        stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                      }`} />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Business Intelligence removed */}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recommendations Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">
                  🎯 Personalized Recommendations
                </h2>
                <Link
                  to="recommendations"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>View all</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((rec, index) => (
                    <div
                      key={rec.productId || rec.product?._id || index}
                      className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200"
                      onClick={() => navigate(`products/${rec.product?._id || rec.productId}`)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                          {rec.product?.images?.[0] ? (
                            <img
                              src={rec.product.images[0]}
                              alt={rec.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center">No Image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {rec.product?.name || 'Product Name'}
                          </h3>
                          <p className="text-sm text-gray-500">{rec.product?.brand || 'Brand'}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(rec.product?.price?.discountedPrice || 0)}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {Math.round((rec.score || 0) * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start browsing products to get personalized recommendations
                  </p>
                  <button
                    onClick={() => navigate('products')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('products')}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <CubeIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Browse Products</span>
                </button>
                <button
                  onClick={() => navigate('ai-assistant')}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <SparklesIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Ask AI Assistant</span>
                </button>
                <button
                  onClick={() => navigate('orders')}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">View Orders</span>
                </button>
                <button
                  onClick={() => navigate('analytics')}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🕒 Recent Activity</h3>
              {dashboardData?.recentActivity?.recentPurchases?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivity.recentPurchases.slice(0, 3).map((purchase, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {purchase.productId?.name || 'Product'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {purchase.quantity || 1}x • {formatCurrency(purchase.price || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="orders"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-block"
                  >
                    View all orders →
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;