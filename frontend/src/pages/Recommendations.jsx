import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  SparklesIcon,
  ChartBarIcon,
  ArrowPathIcon,
  EyeIcon,
  ShoppingCartIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('hybrid');
  const navigate = useNavigate();

  const tabs = [
    { id: 'hybrid', name: 'AI Recommendations', icon: SparklesIcon },
    { id: 'collaborative', name: 'Similar Users', icon: ChartBarIcon },
    { id: 'content', name: 'Similar Products', icon: LightBulbIcon },
    { id: 'trending', name: 'Trending', icon: ArrowTrendingUpIcon },
  ];

  useEffect(() => {
    fetchRecommendations();
    fetchAnalytics();
  }, [activeTab]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRecommendations(activeTab, 12);
      if (response.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await apiService.getRecommendationAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRefreshing(true);
      await apiService.refreshRecommendations();
      await fetchRecommendations();
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const trackInteraction = async (productId, action) => {
    try {
      await apiService.trackRecommendation({
        productId,
        action,
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const handleProductClick = (product) => {
    trackInteraction(product._id, 'clicked');
    navigate(`/products/${product._id}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getRecommendationReason = (rec) => {
    switch (rec.type) {
      case 'hybrid':
        return 'AI-powered personalized recommendation';
      case 'collaborative':
        return 'Users with similar preferences also liked this';
      case 'content':
        return 'Based on your past purchases';
      case 'trending':
        return 'Popular among similar businesses';
      default:
        return 'Recommended for you';
    }
  };

  const RecommendationCard = ({ rec }) => (
    <div
      className="card hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => handleProductClick(rec.product)}
    >
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
        {rec.product.images?.[0] ? (
          <img
            src={rec.product.images[0]}
            alt={rec.product.name}
            className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="h-48 w-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 group-hover:text-qwipo-primary transition-colors">
            {rec.product.name}
          </h3>
          <p className="text-sm text-gray-500">{rec.product.brand} • {rec.product.category}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-qwipo-primary">
              {formatCurrency(rec.product.price.discountedPrice)}
            </span>
            {rec.product.price.discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(rec.product.price.mrp)}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {rec.score && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {Math.round(rec.score * 100)}% match
              </span>
            )}

            {rec.product.price.discount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {rec.product.price.discount}% OFF
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
          💡 {getRecommendationReason(rec)}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${
            rec.product.inventory?.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {rec.product.inventory?.stock > 0 
              ? `${rec.product.inventory.stock} in stock` 
              : 'Out of stock'
            }
          </span>

          {rec.product.ratings?.count > 0 && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="ml-1 text-gray-600">
                {rec.product.ratings.average} ({rec.product.ratings.count})
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              trackInteraction(rec.product._id, 'clicked');
              navigate(`/products/${rec.product._id}`);
            }}
            className="flex-1 btn-outline flex items-center justify-center space-x-2 text-sm"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Add to cart functionality would go here
              trackInteraction(rec.product._id, 'purchased');
            }}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 text-sm"
          >
            <ShoppingCartIcon className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 text-qwipo-primary mr-2" />
            Smart Recommendations
          </h1>
          <p className="text-gray-600">Personalized product suggestions powered by AI</p>
        </div>

        <button
          onClick={refreshRecommendations}
          disabled={refreshing}
          className="btn-outline flex items-center space-x-2"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-qwipo-primary mb-1">
              {analytics.totalRecommendations}
            </div>
            <div className="text-sm text-gray-600">Total Recommendations</div>
          </div>

          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analytics.clickThroughRate}%
            </div>
            <div className="text-sm text-gray-600">Click Through Rate</div>
          </div>

          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analytics.conversionRate}%
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-qwipo-primary text-qwipo-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-48 rounded-lg mb-4" />
              <div className="skeleton-text mb-2" />
              <div className="skeleton-text w-3/4 mb-4" />
              <div className="flex justify-between mb-4">
                <div className="skeleton-text w-1/3" />
                <div className="skeleton-text w-1/4" />
              </div>
              <div className="flex space-x-2">
                <div className="skeleton h-8 flex-1 rounded" />
                <div className="skeleton h-8 flex-1 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="text-sm text-gray-600 mb-4">
            Showing {recommendations.length} personalized recommendations
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.productId} rec={rec} />
            ))}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
          <p className="text-gray-500 mb-4">
            Start browsing products to get personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="btn-primary"
            >
              Browse Products
            </button>
            <button
              onClick={refreshRecommendations}
              className="btn-outline"
            >
              Refresh Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
