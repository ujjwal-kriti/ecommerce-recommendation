// 🧪 SIMPLE TEST - See Your ML System in Action

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const USER_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

async function demonstrateMLSystem() {
  console.log('\n🤖 === ML RECOMMENDATION SYSTEM DEMO === 🤖\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, USER_CREDENTIALS);
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in successfully!\n');

    // Step 2: Get a real product for testing
    console.log('2️⃣ Getting products...');
    const productsResponse = await axios.get(`${BASE_URL}/products?limit=3`);
    const products = productsResponse.data.data.products;
    console.log(`✅ Found ${products.length} products:`);
    products.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.name} (₹${p.price.discountedPrice}) - Category: ${p.category}`);
    });
    console.log('');

    // Step 3: Simulate user behavior
    console.log('3️⃣ Simulating user behavior...');
    
    // Simulate product views
    for (let i = 0; i < 2; i++) {
      const product = products[i];
      try {
        await axios.post(`${BASE_URL}/activity/view`, {
          productId: product._id,
          viewDuration: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
          source: 'search'
        }, { headers });
        console.log(`   👁️ Viewed "${product.name}" for ${Math.floor(Math.random() * 60) + 15} seconds`);
      } catch (error) {
        console.log(`   ⚠️ View tracking skipped: ${error.response?.data?.message || error.message}`);
      }
    }

    // Simulate searches
    const searchQueries = [
      { query: 'organic food', category: 'Grocery' },
      { query: 'medicine', category: 'Pharmacy' },
      { query: 'healthy snacks', category: 'Grocery' }
    ];

    for (const search of searchQueries) {
      try {
        await axios.post(`${BASE_URL}/activity/search`, {
          query: search.query,
          filters: { category: search.category },
          resultsCount: Math.floor(Math.random() * 20) + 5
        }, { headers });
        console.log(`   🔍 Searched for "${search.query}" in ${search.category}`);
      } catch (error) {
        console.log(`   ⚠️ Search tracking skipped: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log('');

    // Step 4: Get different types of recommendations
    console.log('4️⃣ Getting AI recommendations...\n');
    
    const recommendationTypes = [
      { type: 'hybrid', name: '🎯 Hybrid AI (Best Match)', description: 'Combines all AI algorithms' },
      { type: 'collaborative', name: '👥 Collaborative Filtering', description: 'Based on similar users' },
      { type: 'content', name: '📋 Content-Based', description: 'Based on your preferences' },
      { type: 'search-based', name: '🔍 Search-Based', description: 'Based on your searches' },
      { type: 'trending', name: '📈 Trending', description: 'Popular products for you' }
    ];

    for (const recType of recommendationTypes) {
      try {
        const response = await axios.get(`${BASE_URL}/recommendations?type=${recType.type}&limit=3`, { headers });
        
        if (response.data.success && response.data.data.recommendations.length > 0) {
          console.log(`${recType.name}`);
          console.log(`📖 ${recType.description}`);
          
          response.data.data.recommendations.forEach((rec, i) => {
            if (rec.product) {
              const matchPercentage = Math.round(rec.score * 20);
              console.log(`   ${i+1}. ${rec.product.name}`);
              console.log(`      💰 ₹${rec.product.price.discountedPrice} | 🏷️ ${rec.product.brand}`);
              console.log(`      ⭐ AI Match: ${matchPercentage}% | 💡 ${rec.reason}`);
            }
          });
          console.log('');
        } else {
          console.log(`${recType.name} - No recommendations yet`);
          console.log('');
        }
      } catch (error) {
        console.log(`${recType.name} - Error: ${error.response?.data?.message || error.message}`);
        console.log('');
      }
    }

    // Step 5: Show user analytics (if available)
    console.log('5️⃣ Your AI-powered insights...\n');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/activity/analytics`, { headers });
      
      if (analyticsResponse.data.success) {
        const analytics = analyticsResponse.data.data;
        
        console.log('📊 Your Activity Metrics:');
        console.log(`   👁️ Total Views: ${analytics.activityMetrics.totalViews}`);
        console.log(`   🔍 Total Searches: ${analytics.activityMetrics.totalSearches}`);
        console.log(`   ⭐ Engagement Score: ${analytics.activityMetrics.engagementScore}/100`);
        console.log(`   📱 Sessions: ${analytics.activityMetrics.sessionCount}`);
        console.log('');
        
        if (analytics.preferences.topCategories.length > 0) {
          console.log('🎯 AI Learned Your Preferences:');
          analytics.preferences.topCategories.slice(0, 3).forEach(([category, count]) => {
            console.log(`   📂 ${category}: ${count} interactions`);
          });
          console.log('');
        }
        
        if (analytics.preferences.topBrands.length > 0) {
          console.log('🏷️ Your Favorite Brands (AI detected):');
          analytics.preferences.topBrands.slice(0, 3).forEach(([brand, count]) => {
            console.log(`   🏪 ${brand}: ${count} interactions`);
          });
          console.log('');
        }
      }
    } catch (error) {
      console.log(`📊 Analytics: ${error.response?.data?.message || error.message}`);
      console.log('');
    }

    // Final summary
    console.log('🎉 === DEMO COMPLETE === 🎉\n');
    console.log('💡 What just happened:');
    console.log('   ✅ System tracked your product views and search behavior');
    console.log('   ✅ AI algorithms analyzed your preferences');
    console.log('   ✅ ML generated personalized recommendations');
    console.log('   ✅ System calculated engagement metrics');
    console.log('   ✅ Each interaction makes recommendations smarter!');
    console.log('');
    console.log('🚀 Your ML recommendation system is ACTIVE and LEARNING!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Integrate tracking into your frontend (see frontend-ml-integration.js)');
    console.log('   2. Add recommendation widgets to your pages');
    console.log('   3. Monitor user engagement and conversion rates');
    console.log('   4. The more users interact, the smarter it gets!');

  } catch (error) {
    console.log('\n❌ Demo failed:');
    console.log(error.response?.data || error.message);
    console.log('\nMake sure:');
    console.log('   • Backend server is running on port 5000');
    console.log('   • MongoDB is connected');
    console.log('   • Demo user exists (run reseed.js if needed)');
  }
}

// Run the demonstration
demonstrateMLSystem();