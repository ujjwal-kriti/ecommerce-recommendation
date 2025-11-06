const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const logger = require('../utils/logger');

class EnhancedMLRecommendationService {
  constructor() {
    this.users = [];
    this.products = [];
    this.orders = [];
    this.userProfiles = new Map();
    this.productFeatures = new Map();
    this.behaviorWeights = {
      purchase: 5.0,
      view: 1.0,
      search: 2.0,
      searchClick: 3.0,
      cart: 4.0
    };
  }

  // Initialize the service with all data
  async initialize() {
    try {
      logger.info('Initializing Enhanced ML Recommendation Service...');
      
      [this.users, this.products, this.orders] = await Promise.all([
        User.find({ isActive: true }).lean(),
        Product.find({ isActive: true }).lean(),
        Order.find().populate('items.product').lean()
      ]);

      await this.buildComprehensiveUserProfiles();
      await this.buildProductFeatures();
      
      logger.info('Enhanced ML Service initialized with behavior analytics');
    } catch (error) {
      logger.error('ML Service initialization error:', error);
      throw error;
    }
  }

  // Build comprehensive user profiles including all behavior data
  async buildComprehensiveUserProfiles() {
    for (const user of this.users) {
      const profile = {
        userId: user._id.toString(),
        preferences: {
          categories: new Map(),
          brands: new Map(),
          priceRange: { min: 0, max: 100000 }
        },
        behavior: {
          purchaseHistory: [],
          browsingHistory: user.browsingHistory || [],
          searchHistory: user.searchHistory || [],
          totalViews: user.activityMetrics?.totalViews || 0,
          totalSearches: user.activityMetrics?.totalSearches || 0,
          engagementScore: user.activityMetrics?.engagementScore || 0,
          avgViewDuration: user.activityMetrics?.avgViewDuration || 0
        },
        interactionScores: new Map(),
        lastActivity: user.activityMetrics?.lastActivity
      };

      // Process purchase history
      const userOrders = this.orders.filter(order => 
        order.user.toString() === user._id.toString()
      );
      
      userOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product) {
            const productId = item.product._id.toString();
            const score = this.behaviorWeights.purchase * item.quantity;
            
            profile.behavior.purchaseHistory.push({
              productId,
              quantity: item.quantity,
              price: item.price,
              date: order.createdAt
            });

            // Update interaction scores
            this.updateInteractionScore(profile, productId, score);
            
            // Update preferences from purchases
            this.updatePreferences(profile, item.product, score);
          }
        });
      });

      // Process browsing history
      profile.behavior.browsingHistory.forEach(view => {
        if (view.productId) {
          const productId = view.productId.toString();
          let score = this.behaviorWeights.view;
          
          // Increase score for longer view duration
          if (view.viewDuration > 30) score *= 1.5;
          if (view.viewDuration > 60) score *= 2.0;
          
          this.updateInteractionScore(profile, productId, score);
          
          // Find product details for preferences
          const product = this.products.find(p => p._id.toString() === productId);
          if (product) {
            this.updatePreferences(profile, product, score);
          }
        }
      });

      // Process search history
      profile.behavior.searchHistory.forEach(search => {
        const searchScore = this.behaviorWeights.search;
        
        // Process clicked products from search
        search.clickedProducts.forEach(productId => {
          const clickScore = this.behaviorWeights.searchClick;
          this.updateInteractionScore(profile, productId.toString(), clickScore);
          
          const product = this.products.find(p => p._id.toString() === productId.toString());
          if (product) {
            this.updatePreferences(profile, product, clickScore);
          }
        });

        // Infer preferences from search filters
        if (search.filters) {
          if (search.filters.category) {
            profile.preferences.categories.set(
              search.filters.category,
              (profile.preferences.categories.get(search.filters.category) || 0) + searchScore
            );
          }
          
          if (search.filters.brand) {
            profile.preferences.brands.set(
              search.filters.brand,
              (profile.preferences.brands.get(search.filters.brand) || 0) + searchScore
            );
          }
        }
      });

      // Calculate price range preferences
      this.calculatePricePreferences(profile);
      
      this.userProfiles.set(user._id.toString(), profile);
    }
  }

  // Update interaction scores for products
  updateInteractionScore(profile, productId, score) {
    profile.interactionScores.set(
      productId,
      (profile.interactionScores.get(productId) || 0) + score
    );
  }

  // Update user preferences based on product interaction
  updatePreferences(profile, product, score) {
    // Category preferences
    profile.preferences.categories.set(
      product.category,
      (profile.preferences.categories.get(product.category) || 0) + score
    );

    // Brand preferences
    profile.preferences.brands.set(
      product.brand,
      (profile.preferences.brands.get(product.brand) || 0) + score
    );
  }

  // Calculate price range preferences
  calculatePricePreferences(profile) {
    const prices = [];
    profile.behavior.purchaseHistory.forEach(item => {
      prices.push(item.price);
    });

    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      
      profile.preferences.priceRange = {
        min: Math.max(0, q1 - (q3 - q1)),
        max: q3 + (q3 - q1)
      };
    }
  }

  // Build product features using TF-IDF
  async buildProductFeatures() {
    this.products.forEach(product => {
      const features = {
        category: product.category,
        brand: product.brand,
        priceRange: this.getPriceRange(product.price.discountedPrice),
        popularity: this.calculatePopularity(product),
        tags: product.tags || [],
        description: product.description
      };
      
      this.productFeatures.set(product._id.toString(), features);
    });
  }

  // Get price range category
  getPriceRange(price) {
    if (price < 50) return 'budget';
    if (price < 200) return 'mid-range';
    if (price < 500) return 'premium';
    return 'luxury';
  }

  // Calculate product popularity
  calculatePopularity(product) {
    const views = product.analytics?.views || 0;
    const purchases = product.analytics?.purchases || 0;
    return (views * 0.1) + (purchases * 2);
  }

  // Get comprehensive hybrid recommendations
  async getComprehensiveRecommendations(userId, limit = 10) {
    try {
      const profile = this.userProfiles.get(userId);
      if (!profile) {
        return await this.getTrendingRecommendations(limit);
      }

      const recommendations = new Map();

      // 1. Collaborative filtering based on similar users
      const collaborativeRecs = await this.getAdvancedCollaborativeRecommendations(userId, limit);
      collaborativeRecs.forEach(rec => {
        recommendations.set(rec.productId, (recommendations.get(rec.productId) || 0) + rec.score * 0.4);
      });

      // 2. Content-based filtering using preferences
      const contentRecs = await this.getBehaviorBasedContentRecommendations(userId, limit);
      contentRecs.forEach(rec => {
        recommendations.set(rec.productId, (recommendations.get(rec.productId) || 0) + rec.score * 0.3);
      });

      // 3. Search pattern based recommendations
      const searchRecs = await this.getSearchPatternRecommendations(userId, limit);
      searchRecs.forEach(rec => {
        recommendations.set(rec.productId, (recommendations.get(rec.productId) || 0) + rec.score * 0.2);
      });

      // 4. Trending products with user preference boost
      const trendingRecs = await this.getPersonalizedTrendingRecommendations(userId, limit);
      trendingRecs.forEach(rec => {
        recommendations.set(rec.productId, (recommendations.get(rec.productId) || 0) + rec.score * 0.1);
      });

      // Convert to array and sort by score
      const finalRecommendations = Array.from(recommendations.entries())
        .map(([productId, score]) => ({
          productId,
          score: parseFloat(score.toFixed(4)),
          reason: 'Personalized hybrid recommendation'
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return finalRecommendations;

    } catch (error) {
      logger.error('Error getting comprehensive recommendations:', error);
      return await this.getTrendingRecommendations(limit);
    }
  }

  // Advanced collaborative filtering using behavior data
  async getAdvancedCollaborativeRecommendations(userId, limit = 10) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    const userSimilarities = [];

    // Find users with similar interaction patterns
    this.userProfiles.forEach((otherProfile, otherUserId) => {
      if (otherUserId !== userId) {
        const similarity = this.calculateUserSimilarity(profile, otherProfile);
        if (similarity > 0.1) {
          userSimilarities.push({ userId: otherUserId, similarity });
        }
      }
    });

    // Sort by similarity and get top similar users
    userSimilarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = userSimilarities.slice(0, 10);

    const recommendations = new Map();

    topSimilarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const similarProfile = this.userProfiles.get(similarUserId);
      
      similarProfile.interactionScores.forEach((score, productId) => {
        // Only recommend products the current user hasn't interacted with
        if (!profile.interactionScores.has(productId)) {
          const weightedScore = score * similarity;
          recommendations.set(productId, (recommendations.get(productId) || 0) + weightedScore);
        }
      });
    });

    return Array.from(recommendations.entries())
      .map(([productId, score]) => ({
        productId,
        score: parseFloat(score.toFixed(4)),
        reason: 'Users with similar preferences also liked'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Content-based recommendations using behavior patterns
  async getBehaviorBasedContentRecommendations(userId, limit = 10) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    const recommendations = [];

    this.products.forEach(product => {
      const productId = product._id.toString();
      
      // Skip products user has already interacted with
      if (profile.interactionScores.has(productId)) return;

      let score = 0;

      // Category preference score
      const categoryScore = profile.preferences.categories.get(product.category) || 0;
      score += categoryScore * 0.4;

      // Brand preference score
      const brandScore = profile.preferences.brands.get(product.brand) || 0;
      score += brandScore * 0.3;

      // Price preference score
      const priceScore = this.getPricePreferenceScore(product.price.discountedPrice, profile.preferences.priceRange);
      score += priceScore * 0.2;

      // Popularity boost
      const popularityScore = this.calculatePopularity(product);
      score += popularityScore * 0.1;

      if (score > 0) {
        recommendations.push({
          productId,
          score: parseFloat(score.toFixed(4)),
          reason: 'Based on your preferences and browsing history'
        });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Recommendations based on search patterns
  async getSearchPatternRecommendations(userId, limit = 10) {
    const profile = this.userProfiles.get(userId);
    if (!profile || !profile.behavior.searchHistory.length) return [];

    const searchTerms = new Map();
    const searchFilters = {
      categories: new Map(),
      brands: new Map()
    };

    // Analyze search patterns
    profile.behavior.searchHistory.forEach(search => {
      // Extract terms from search queries
      const terms = search.query.toLowerCase().split(' ').filter(term => term.length > 2);
      terms.forEach(term => {
        searchTerms.set(term, (searchTerms.get(term) || 0) + 1);
      });

      // Count filter usage
      if (search.filters.category) {
        searchFilters.categories.set(search.filters.category, 
          (searchFilters.categories.get(search.filters.category) || 0) + 1);
      }
      if (search.filters.brand) {
        searchFilters.brands.set(search.filters.brand, 
          (searchFilters.brands.get(search.filters.brand) || 0) + 1);
      }
    });

    const recommendations = [];

    this.products.forEach(product => {
      const productId = product._id.toString();
      
      // Skip products user has already interacted with
      if (profile.interactionScores.has(productId)) return;

      let score = 0;

      // Match search terms in product name/description
      const productText = `${product.name} ${product.description}`.toLowerCase();
      searchTerms.forEach((count, term) => {
        if (productText.includes(term)) {
          score += count * 0.5;
        }
      });

      // Match frequently searched categories
      const categoryCount = searchFilters.categories.get(product.category) || 0;
      score += categoryCount * 0.3;

      // Match frequently searched brands
      const brandCount = searchFilters.brands.get(product.brand) || 0;
      score += brandCount * 0.2;

      if (score > 0) {
        recommendations.push({
          productId,
          score: parseFloat(score.toFixed(4)),
          reason: 'Based on your search patterns'
        });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Personalized trending recommendations
  async getPersonalizedTrendingRecommendations(userId, limit = 10) {
    const profile = this.userProfiles.get(userId);
    
    const trendingProducts = this.products
      .filter(product => !profile?.interactionScores.has(product._id.toString()))
      .map(product => {
        let score = this.calculatePopularity(product);
        
        // Boost score if product matches user preferences
        if (profile) {
          const categoryBoost = profile.preferences.categories.get(product.category) || 0;
          const brandBoost = profile.preferences.brands.get(product.brand) || 0;
          score += (categoryBoost + brandBoost) * 0.1;
        }

        return {
          productId: product._id.toString(),
          score: parseFloat(score.toFixed(4)),
          reason: 'Trending products you might like'
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return trendingProducts;
  }

  // Calculate similarity between two users
  calculateUserSimilarity(profile1, profile2) {
    let similarity = 0;
    let totalWeight = 0;

    // Category preferences similarity
    const categoryWeight = 0.4;
    const categorySim = this.calculateMapSimilarity(
      profile1.preferences.categories, 
      profile2.preferences.categories
    );
    similarity += categorySim * categoryWeight;
    totalWeight += categoryWeight;

    // Brand preferences similarity
    const brandWeight = 0.3;
    const brandSim = this.calculateMapSimilarity(
      profile1.preferences.brands, 
      profile2.preferences.brands
    );
    similarity += brandSim * brandWeight;
    totalWeight += brandWeight;

    // Interaction pattern similarity
    const interactionWeight = 0.3;
    const interactionSim = this.calculateInteractionSimilarity(
      profile1.interactionScores, 
      profile2.interactionScores
    );
    similarity += interactionSim * interactionWeight;
    totalWeight += interactionWeight;

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  // Calculate similarity between two maps
  calculateMapSimilarity(map1, map2) {
    const keys1 = new Set(map1.keys());
    const keys2 = new Set(map2.keys());
    const commonKeys = new Set([...keys1].filter(k => keys2.has(k)));
    
    if (commonKeys.size === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    commonKeys.forEach(key => {
      const val1 = map1.get(key) || 0;
      const val2 = map2.get(key) || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    return norm1 > 0 && norm2 > 0 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  }

  // Calculate interaction similarity
  calculateInteractionSimilarity(interactions1, interactions2) {
    const products1 = new Set(interactions1.keys());
    const products2 = new Set(interactions2.keys());
    const commonProducts = new Set([...products1].filter(p => products2.has(p)));
    
    if (commonProducts.size === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    commonProducts.forEach(productId => {
      const score1 = interactions1.get(productId) || 0;
      const score2 = interactions2.get(productId) || 0;
      dotProduct += score1 * score2;
      norm1 += score1 * score1;
      norm2 += score2 * score2;
    });

    return norm1 > 0 && norm2 > 0 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  }

  // Get price preference score
  getPricePreferenceScore(price, priceRange) {
    if (price >= priceRange.min && price <= priceRange.max) {
      return 1.0;
    } else {
      const distance = Math.min(
        Math.abs(price - priceRange.min),
        Math.abs(price - priceRange.max)
      );
      const range = priceRange.max - priceRange.min;
      return Math.max(0, 1 - (distance / range));
    }
  }

  // Get trending recommendations (fallback)
  async getTrendingRecommendations(limit = 10) {
    return this.products
      .map(product => ({
        productId: product._id.toString(),
        score: this.calculatePopularity(product),
        reason: 'Trending product'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// Create singleton instance
const enhancedMLService = new EnhancedMLRecommendationService();

module.exports = enhancedMLService;