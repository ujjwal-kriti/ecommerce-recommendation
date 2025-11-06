// 🎯 PRACTICAL EXAMPLE - Complete Frontend Integration

import React, { useState, useEffect } from 'react';

// ===== 1. USER ACTIVITY TRACKING SERVICE =====
class UserActivityService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  async trackProductView(productId, viewDuration = 0, source = 'direct') {
    try {
      await fetch(`${this.apiBaseUrl}/api/activity/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ productId, viewDuration, source })
      });
      console.log(`✅ Tracked view: ${productId} for ${viewDuration}s`);
    } catch (error) {
      console.error('❌ Failed to track view:', error);
    }
  }

  async trackSearch(query, filters = {}, resultsCount = 0) {
    try {
      await fetch(`${this.apiBaseUrl}/api/activity/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ query, filters, resultsCount })
      });
      console.log(`✅ Tracked search: "${query}" with ${resultsCount} results`);
    } catch (error) {
      console.error('❌ Failed to track search:', error);
    }
  }

  async trackSearchClick(productId, searchQuery) {
    try {
      await fetch(`${this.apiBaseUrl}/api/activity/search-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ productId, searchQuery })
      });
      console.log(`✅ Tracked search click: ${productId} from "${searchQuery}"`);
    } catch (error) {
      console.error('❌ Failed to track search click:', error);
    }
  }

  async getRecommendations(type = 'hybrid', limit = 10) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/recommendations?type=${type}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      return data.success ? data.data.recommendations : [];
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      return [];
    }
  }

  async getUserAnalytics() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/activity/analytics`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      return null;
    }
  }
}

// ===== 2. PRODUCT PAGE WITH TRACKING =====
function ProductPage({ productId, userToken, apiBaseUrl }) {
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [viewStartTime] = useState(Date.now());
  
  const activityService = new UserActivityService(apiBaseUrl, userToken);

  useEffect(() => {
    // Load product and track view
    loadProduct();
    trackInitialView();
    
    // Track view duration when user leaves
    return () => {
      const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
      activityService.trackProductView(productId, viewDuration, 'direct');
    };
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/products/${productId}`);
      const data = await response.json();
      setProduct(data.data);
      
      // Load similar product recommendations
      const recs = await activityService.getRecommendations('content', 6);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const trackInitialView = () => {
    activityService.trackProductView(productId, 0, 'direct');
  };

  const handleRecommendationClick = (recProductId) => {
    // Track recommendation interaction
    fetch(`${apiBaseUrl}/api/recommendations/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        productId: recProductId,
        action: 'clicked'
      })
    });
    
    // Navigate to product
    window.location.href = `/products/${recProductId}`;
  };

  if (!product) return <div>Loading product...</div>;

  return (
    <div className="product-page">
      <div className="product-details">
        <img src={product.images[0]} alt={product.name} />
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="brand">{product.brand}</p>
          <p className="price">₹{product.price.discountedPrice}</p>
          <p className="description">{product.description}</p>
          <button className="add-to-cart">Add to Cart</button>
        </div>
      </div>

      {/* SMART RECOMMENDATIONS SECTION */}
      <div className="recommendations-section">
        <h3>🤖 Recommended for You</h3>
        <div className="recommendations-grid">
          {recommendations.map(rec => (
            <div key={rec.productId} className="recommendation-card">
              <img 
                src={rec.product.images[0]} 
                alt={rec.product.name}
                onClick={() => handleRecommendationClick(rec.productId)}
              />
              <h4>{rec.product.name}</h4>
              <p>₹{rec.product.price.discountedPrice}</p>
              <p className="reason">💡 {rec.reason}</p>
              <p className="score">⭐ Match: {Math.round(rec.score * 20)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 3. SEARCH PAGE WITH BEHAVIOR TRACKING =====
function SearchPage({ userToken, apiBaseUrl }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  
  const activityService = new UserActivityService(apiBaseUrl, userToken);

  const handleSearch = async () => {
    try {
      // Perform search
      const searchParams = new URLSearchParams({
        search: query,
        ...filters,
        limit: 20
      });
      
      const response = await fetch(`${apiBaseUrl}/api/products?${searchParams}`);
      const data = await response.json();
      
      setResults(data.data.products);
      setCurrentSearchQuery(query);
      
      // Track the search behavior
      await activityService.trackSearch(query, filters, data.data.products.length);
      
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleResultClick = (productId) => {
    // Track search result click
    activityService.trackSearchClick(productId, currentSearchQuery);
    
    // Navigate to product
    window.location.href = `/products/${productId}`;
  };

  return (
    <div className="search-page">
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍 Search</button>
      </div>

      <div className="search-filters">
        <select 
          value={filters.category || ''} 
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Grocery">Grocery</option>
          <option value="Pharmacy">Pharmacy</option>
        </select>
        
        <select 
          value={filters.brand || ''} 
          onChange={(e) => setFilters({...filters, brand: e.target.value})}
        >
          <option value="">All Brands</option>
          <option value="Organic Fresh">Organic Fresh</option>
          <option value="HealthPlus">HealthPlus</option>
        </select>
      </div>

      <div className="search-results">
        <h3>Search Results ({results.length})</h3>
        <div className="products-grid">
          {results.map(product => (
            <div 
              key={product._id} 
              className="product-card"
              onClick={() => handleResultClick(product._id)}
            >
              <img src={product.images[0]} alt={product.name} />
              <h4>{product.name}</h4>
              <p>{product.brand}</p>
              <p>₹{product.price.discountedPrice}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 4. DASHBOARD WITH ML ANALYTICS =====
function MLAnalyticsDashboard({ userToken, apiBaseUrl }) {
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  
  const activityService = new UserActivityService(apiBaseUrl, userToken);

  useEffect(() => {
    loadAnalytics();
    loadAllRecommendations();
  }, []);

  const loadAnalytics = async () => {
    const data = await activityService.getUserAnalytics();
    setAnalytics(data);
  };

  const loadAllRecommendations = async () => {
    const types = ['hybrid', 'collaborative', 'content', 'search-based', 'trending'];
    const recData = {};
    
    for (const type of types) {
      recData[type] = await activityService.getRecommendations(type, 5);
    }
    
    setRecommendations(recData);
  };

  if (!analytics) return <div>Loading your ML insights...</div>;

  return (
    <div className="ml-dashboard">
      <h1>🤖 Your AI Insights</h1>
      
      {/* USER ACTIVITY METRICS */}
      <div className="activity-metrics">
        <h2>📊 Your Activity</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>👁️ Products Viewed</h3>
            <p className="metric-value">{analytics.activityMetrics.totalViews}</p>
          </div>
          <div className="metric-card">
            <h3>🔍 Searches Made</h3>
            <p className="metric-value">{analytics.activityMetrics.totalSearches}</p>
          </div>
          <div className="metric-card">
            <h3>⭐ Engagement Score</h3>
            <p className="metric-value">{analytics.activityMetrics.engagementScore}/100</p>
          </div>
          <div className="metric-card">
            <h3>⏱️ Avg View Time</h3>
            <p className="metric-value">{analytics.activityMetrics.avgViewDuration}s</p>
          </div>
        </div>
      </div>

      {/* PREFERENCE INSIGHTS */}
      <div className="preferences-section">
        <h2>🎯 Your Preferences (Learned by AI)</h2>
        <div className="preferences-grid">
          <div className="preference-card">
            <h3>📂 Top Categories</h3>
            {analytics.preferences.topCategories.slice(0, 3).map(([category, count]) => (
              <div key={category} className="preference-item">
                <span>{category}</span>
                <span>{count} interactions</span>
              </div>
            ))}
          </div>
          <div className="preference-card">
            <h3>🏷️ Favorite Brands</h3>
            {analytics.preferences.topBrands.slice(0, 3).map(([brand, count]) => (
              <div key={brand} className="preference-item">
                <span>{brand}</span>
                <span>{count} interactions</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML RECOMMENDATION SHOWCASE */}
      <div className="recommendations-showcase">
        <h2>🚀 AI Recommendations (Different Algorithms)</h2>
        
        {Object.entries(recommendations).map(([type, recs]) => (
          <div key={type} className="recommendation-section">
            <h3>
              {type === 'hybrid' && '🎯 Best Match (Hybrid AI)'}
              {type === 'collaborative' && '👥 Users Like You'}
              {type === 'content' && '📋 Based on Your Preferences'}
              {type === 'search-based' && '🔍 From Your Searches'}
              {type === 'trending' && '📈 Trending for You'}
            </h3>
            <div className="recommendations-row">
              {recs.slice(0, 4).map(rec => (
                <div key={rec.productId} className="mini-product-card">
                  <img src={rec.product.images[0]} alt={rec.product.name} />
                  <p>{rec.product.name}</p>
                  <p>₹{rec.product.price.discountedPrice}</p>
                  <p className="ai-score">AI Score: {Math.round(rec.score * 20)}%</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY */}
      <div className="recent-activity">
        <h2>🕐 Recent Activity</h2>
        <div className="activity-timeline">
          {analytics.recentViews.slice(0, 5).map((view, index) => (
            <div key={index} className="activity-item">
              <p>👁️ Viewed <strong>{view.productId.name}</strong></p>
              <p>Duration: {view.viewDuration}s</p>
              <p>Source: {view.source}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 5. EXPORT FOR USE =====
export {
  UserActivityService,
  ProductPage,
  SearchPage,
  MLAnalyticsDashboard
};

// ===== HOW TO USE IN YOUR APP =====
/*
1. Import the service:
   import { UserActivityService } from './MLIntegration';

2. Initialize with user token:
   const mlService = new UserActivityService('http://localhost:5000', userToken);

3. Track user actions:
   mlService.trackProductView(productId, 30, 'search');
   mlService.trackSearch('organic food', {category: 'Grocery'}, 15);

4. Get recommendations:
   const recommendations = await mlService.getRecommendations('hybrid', 8);

5. Display analytics:
   const analytics = await mlService.getUserAnalytics();

Your ML system will learn from every interaction and get smarter! 🚀
*/