# 🤖 Enhanced ML Recommendation System - User Guide

## 📋 **What This System Does**

Your ML system now tracks and analyzes:
- ✅ **Order History** - What users purchase and when
- ✅ **Browsing Behavior** - Which products users view and for how long
- ✅ **Search Patterns** - What users search for and click on
- ✅ **User Engagement** - How active and engaged users are
- ✅ **Preferences** - Categories, brands, and price ranges users prefer

## 🎯 **How to Use the System**

### **1. Frontend Integration - Track User Activity**

Add this JavaScript to your frontend to track user behavior:

```javascript
// Track when user views a product
async function trackProductView(productId, viewDuration = 0, source = 'direct') {
  try {
    await fetch('/api/activity/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        productId,
        viewDuration, // in seconds
        source // 'search', 'recommendation', 'category', 'direct'
      })
    });
  } catch (error) {
    console.error('Failed to track view:', error);
  }
}

// Track user searches
async function trackSearch(query, filters = {}, resultsCount = 0) {
  try {
    await fetch('/api/activity/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        query,
        filters: {
          category: filters.category,
          brand: filters.brand,
          priceRange: filters.priceRange
        },
        resultsCount
      })
    });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
}

// Track when user clicks a product from search results
async function trackSearchClick(productId, searchQuery) {
  try {
    await fetch('/api/activity/search-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        productId,
        searchQuery
      })
    });
  } catch (error) {
    console.error('Failed to track search click:', error);
  }
}
```

### **2. Get Personalized Recommendations**

```javascript
// Get different types of recommendations
async function getRecommendations(type = 'hybrid', limit = 10) {
  try {
    const response = await fetch(`/api/recommendations?type=${type}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    return data.data.recommendations;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}

// Available recommendation types:
// 'hybrid' - Best overall recommendations (default)
// 'collaborative' - Based on similar users
// 'content' - Based on user preferences
// 'search-based' - Based on search patterns  
// 'trending' - Popular products personalized for user
```

### **3. Display Recommendations in Your UI**

```javascript
// Example React component for recommendations
function RecommendationsSection({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      const recs = await getRecommendations('hybrid', 8);
      setRecommendations(recs);
      setLoading(false);
    }
    
    if (userId) {
      loadRecommendations();
    }
  }, [userId]);

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div className="recommendations">
      <h3>Recommended for You</h3>
      <div className="product-grid">
        {recommendations.map(rec => (
          <div key={rec.productId} className="product-card">
            <img src={rec.product.images[0]} alt={rec.product.name} />
            <h4>{rec.product.name}</h4>
            <p>₹{rec.product.price.discountedPrice}</p>
            <p className="reason">{rec.reason}</p>
            <p className="score">Score: {rec.score}</p>
            <button 
              onClick={() => handleProductClick(rec.productId)}
            >
              View Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **4. Track User Interactions**

```javascript
// Track when user clicks on a recommendation
async function handleRecommendationClick(productId, recommendationId) {
  // Track the click
  await fetch('/api/recommendations/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      productId,
      action: 'clicked',
      recommendationId
    })
  });
  
  // Navigate to product page
  window.location.href = `/products/${productId}`;
}

// Track when user purchases a recommended product
async function handleRecommendationPurchase(productId, recommendationId) {
  await fetch('/api/recommendations/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      productId,
      action: 'purchased',
      recommendationId
    })
  });
}
```

## 📊 **Monitor User Analytics**

### **1. Get User Activity Analytics**

```javascript
async function getUserAnalytics() {
  try {
    const response = await fetch('/api/activity/analytics', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return null;
  }
}

// Returns:
// {
//   activityMetrics: {
//     totalViews: 45,
//     totalSearches: 12,
//     engagementScore: 75,
//     avgViewDuration: 30,
//     sessionCount: 8,
//     lastActivity: "2025-09-27T10:30:00Z"
//   },
//   recentViews: [...], // Last 20 product views
//   recentSearches: [...], // Last 10 searches
//   preferences: {
//     topCategories: [["Grocery", 15], ["Pharmacy", 8]],
//     topBrands: [["Organic Fresh", 10], ["HealthPlus", 6]]
//   }
// }
```

### **2. Create Analytics Dashboard**

```javascript
function UserAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      const data = await getUserAnalytics();
      setAnalytics(data);
    }
    loadAnalytics();
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      <h2>Your Activity Insights</h2>
      
      <div className="metrics-grid">
        <div className="metric">
          <h3>Products Viewed</h3>
          <p>{analytics.activityMetrics.totalViews}</p>
        </div>
        <div className="metric">
          <h3>Searches Made</h3>
          <p>{analytics.activityMetrics.totalSearches}</p>
        </div>
        <div className="metric">
          <h3>Engagement Score</h3>
          <p>{analytics.activityMetrics.engagementScore}/100</p>
        </div>
        <div className="metric">
          <h3>Avg. View Time</h3>
          <p>{analytics.activityMetrics.avgViewDuration}s</p>
        </div>
      </div>

      <div className="preferences">
        <h3>Your Top Categories</h3>
        {analytics.preferences.topCategories.map(([category, count]) => (
          <div key={category} className="preference-item">
            <span>{category}</span>
            <span>{count} interactions</span>
          </div>
        ))}
      </div>

      <div className="recent-activity">
        <h3>Recent Views</h3>
        {analytics.recentViews.slice(0, 5).map(view => (
          <div key={view._id} className="activity-item">
            <p>{view.productId.name}</p>
            <p>Viewed for {view.viewDuration}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔄 **Implementation Workflow**

### **Step 1: Add Tracking to Product Pages**
```javascript
// In your product detail component
useEffect(() => {
  const startTime = Date.now();
  
  // Track page view when component mounts
  trackProductView(productId, 0, 'direct');
  
  // Track view duration when user leaves
  return () => {
    const viewDuration = Math.floor((Date.now() - startTime) / 1000);
    trackProductView(productId, viewDuration, 'direct');
  };
}, [productId]);
```

### **Step 2: Add Tracking to Search**
```javascript
// In your search component
async function handleSearch(query, filters) {
  const results = await searchProducts(query, filters);
  
  // Track the search
  await trackSearch(query, filters, results.length);
  
  setSearchResults(results);
}

// Track clicks on search results
function handleSearchResultClick(productId, query) {
  trackSearchClick(productId, query);
  // Navigate to product...
}
```

### **Step 3: Add Recommendation Sections**
```javascript
// In your home page or product listing
<RecommendationsSection 
  title="Recommended for You"
  type="hybrid"
  limit={6}
/>

<RecommendationsSection 
  title="Based on Your Searches"
  type="search-based"
  limit={4}
/>

<RecommendationsSection 
  title="Trending in Your Area"
  type="trending"
  limit={4}
/>
```

### **Step 4: Monitor and Optimize**
```javascript
// Create admin dashboard to monitor ML performance
async function getRecommendationMetrics() {
  const response = await fetch('/api/analytics/recommendations', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return response.json();
}

// Track conversion rates
async function getConversionRates() {
  const response = await fetch('/api/analytics/conversions', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  return response.json();
}
```

## 📈 **Expected Results**

With proper implementation, you should see:

- **📊 Higher Engagement**: Users spend more time browsing
- **🛒 Better Conversions**: More purchases from recommendations  
- **🔄 Repeat Customers**: Users return more frequently
- **🎯 Personalized Experience**: Each user sees relevant products
- **📱 Smart Search**: Search results improve based on behavior

## 🚀 **Next Steps**

1. **Implement tracking** on all product interactions
2. **Add recommendation widgets** to key pages
3. **Create analytics dashboards** for insights
4. **A/B test different** recommendation types
5. **Monitor performance** and optimize algorithms

Your ML system is now **intelligent and learning** from every user interaction! 🎉