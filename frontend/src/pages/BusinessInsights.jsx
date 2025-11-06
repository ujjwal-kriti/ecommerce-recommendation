import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartPieIcon, 
  ArrowTrendingUpIcon, 
  CurrencyDollarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BusinessInsights = () => {
  const navigate = useNavigate();
  const [diversityData, setDiversityData] = useState(null);
  const [costOptimization, setCostOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('diversity');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [diversityResponse, costResponse] = await Promise.all([
        apiService.getBusinessInsights('diversification'),
        apiService.getBusinessInsights('cost-optimization')
      ]);
      
      setDiversityData(diversityResponse.data);
      setCostOptimization(costResponse.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightAction = (insight) => {
    console.log('Insight action clicked:', insight);
    
    // Handle different types of insight actions
    if (insight.action?.includes('Explore') || insight.action?.includes('Browse')) {
      navigate('/dashboard/products');
    } else if (insight.action?.includes('View') || insight.action?.includes('Check')) {
      navigate('/dashboard/analytics');
    } else {
      // Default action - go to products
      navigate('/dashboard/products');
    }
  };

  const handleExploreProduct = (product) => {
    console.log('Exploring product:', product);
    if (product._id) {
      navigate(`/dashboard/products/${product._id}`);
    } else {
      // If no specific product ID, go to products page with filters
      navigate(`/dashboard/products?category=${encodeURIComponent(product.category)}`);
    }
  };

  const handleSwitchProduct = (suggestion) => {
    console.log('Switch & Save clicked for:', suggestion);
    if (suggestion.alternative?._id) {
      navigate(`/dashboard/products/${suggestion.alternative._id}`);
    } else {
      // Navigate to products page to find alternatives
      navigate('/dashboard/products');
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'opportunity':
        return <SparklesIcon className="h-5 w-5 text-green-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDiversityColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🧠 Business Intelligence</h1>
        <p className="mt-2 text-gray-600">
          Combat repetitive buying behavior and discover new opportunities
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('diversity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'diversity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartPieIcon className="h-5 w-5 inline mr-2" />
            Purchase Diversity
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'optimization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CurrencyDollarIcon className="h-5 w-5 inline mr-2" />
            Cost Optimization
          </button>
        </nav>
      </div>

      {/* Diversity Analysis Tab */}
      {activeTab === 'diversity' && diversityData && (
        <div className="space-y-8">
          {/* Diversity Score Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Diversity Score</h2>
                <p className="text-gray-600">How varied are your purchases?</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getDiversityColor(diversityData.diversityScore)}`}>
                <span className="text-2xl font-bold">{diversityData.diversityScore}%</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Spending Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diversityData.categoryBreakdown?.map((category, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{category.spend?.toLocaleString()}</span>
                      <span>{category.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 AI Insights</h3>
            <div className="space-y-4">
              {diversityData.insights?.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="text-gray-800">{insight.message}</p>
                    <button 
                      onClick={() => handleInsightAction(insight)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer transition-colors"
                    >
                      {insight.action} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unexplored Opportunities */}
          {diversityData.recommendedProducts?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🌟 Unexplored Opportunities ({diversityData.unexploredOpportunities} categories)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {diversityData.recommendedProducts.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img
                        src={product.images?.[0] || '/api/placeholder/300/200'}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Product+Image';
                        }}
                      />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-blue-600">₹{product.price?.discountedPrice || product.price}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExploreProduct(product);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer transition-colors z-10 relative"
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cost Optimization Tab */}
      {activeTab === 'optimization' && costOptimization && (
        <div className="space-y-8">
          {/* Savings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Potential Monthly Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{costOptimization.totalPotentialSavings?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Quarterly Projection</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{costOptimization.quarterlyProjection?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <ChartPieIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Impact Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {costOptimization.impactScore}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">💡 Smart Cost Optimization Suggestions</h3>
            <div className="space-y-6">
              {costOptimization.optimizationSuggestions?.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-green-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Product */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">CURRENT CHOICE</h4>
                      <div className="flex items-center space-x-4">
                        <img
                          src={suggestion.currentProduct?.images?.[0] || '/api/placeholder/80/80'}
                          alt={suggestion.currentProduct?.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{suggestion.currentProduct?.name}</h5>
                          <p className="text-sm text-gray-600">{suggestion.currentProduct?.brand}</p>
                          <p className="text-lg font-semibold text-red-600">₹{suggestion.currentProduct?.price?.discountedPrice || suggestion.currentProduct?.price}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alternative Product */}
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">RECOMMENDED ALTERNATIVE</h4>
                      <div className="flex items-center space-x-4">
                        <img
                          src={suggestion.alternative?.images?.[0] || '/api/placeholder/80/80'}
                          alt={suggestion.alternative?.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{suggestion.alternative?.name}</h5>
                          <p className="text-sm text-gray-600">{suggestion.alternative?.brand}</p>
                          <p className="text-lg font-semibold text-green-600">₹{suggestion.alternative?.price?.discountedPrice || suggestion.alternative?.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Info */}
                  <div className="mt-4 flex justify-between items-center bg-green-100 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-600">Potential Savings</p>
                        <p className="text-xl font-bold text-green-700">
                          ₹{suggestion.potentialSavings?.toLocaleString()} ({suggestion.savingsPercentage}%)
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSwitchProduct(suggestion)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer transition-colors"
                    >
                      Switch & Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessInsights;