const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');

/**
 * Simple Order-Based Recommendation Service
 * Analyzes user's purchase history to recommend similar products
 */
class SimpleOrderRecommendationService {
  
  /**
   * Generate recommendations based on user's order history
   */
  async getOrderBasedRecommendations(userId, limit = 6) {
    try {
      logger.info(`🛍️ Generating order-based recommendations for user: ${userId}`);
      
      // Get user's order history
      const userOrders = await Order.find({ userId })
        .populate('items.productId', 'name category brand businessType price tags')
        .sort({ createdAt: -1 })
        .lean();

      if (!userOrders || userOrders.length === 0) {
        logger.info('No order history found, returning popular products');
        return await this.getPopularProducts(limit);
      }

      // Extract purchased products and analyze patterns
      const purchasedProducts = [];
      const categoryFrequency = new Map();
      const brandFrequency = new Map();
      const priceRanges = [];
      const businessTypes = new Set();

      userOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.productId) {
            const product = item.productId;
            purchasedProducts.push(product._id.toString());
            
            // Analyze categories
            if (product.category) {
              categoryFrequency.set(product.category, (categoryFrequency.get(product.category) || 0) + item.quantity);
            }
            
            // Analyze brands
            if (product.brand) {
              brandFrequency.set(product.brand, (brandFrequency.get(product.brand) || 0) + item.quantity);
            }
            
            // Analyze price ranges
            if (product.price && product.price.discountedPrice) {
              priceRanges.push(product.price.discountedPrice);
            }
            
            // Track business types
            if (product.businessType) {
              businessTypes.add(product.businessType);
            }
          }
        });
      });

      // Calculate preferences
      const preferredCategories = Array.from(categoryFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
      
      const preferredBrands = Array.from(brandFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      const avgPrice = priceRanges.length > 0 ? 
        priceRanges.reduce((sum, price) => sum + price, 0) / priceRanges.length : 0;

      logger.info(`User preferences - Categories: ${preferredCategories.join(', ')}, Brands: ${preferredBrands.join(', ')}, Avg Price: ₹${avgPrice.toFixed(2)}`);

      // Find similar products
      const recommendedProducts = await Product.find({
        $and: [
          { isActive: true },
          { _id: { $nin: purchasedProducts } }, // Exclude already purchased
          {
            $or: [
              { category: { $in: preferredCategories } },
              { brand: { $in: preferredBrands } },
              { businessType: { $in: Array.from(businessTypes) } },
              // Price range matching
              {
                'price.discountedPrice': {
                  $gte: Math.max(0, avgPrice * 0.7),
                  $lte: avgPrice * 1.5
                }
              }
            ]
          }
        ]
      })
      .limit(limit * 2) // Get more to filter and rank
      .lean();

      // Score and rank recommendations
      const scoredRecommendations = recommendedProducts.map(product => {
        let score = 0;
        let reasons = [];

        // Category matching
        if (preferredCategories.includes(product.category)) {
          const categoryRank = preferredCategories.indexOf(product.category) + 1;
          score += (4 - categoryRank) * 0.4;
          reasons.push(`Similar category: ${product.category}`);
        }

        // Brand matching
        if (preferredBrands.includes(product.brand)) {
          const brandRank = preferredBrands.indexOf(product.brand) + 1;
          score += (4 - brandRank) * 0.3;
          reasons.push(`Preferred brand: ${product.brand}`);
        }

        // Business type matching
        if (businessTypes.has(product.businessType)) {
          score += 0.2;
          reasons.push(`Same store type: ${product.businessType}`);
        }

        // Price range matching
        if (product.price && product.price.discountedPrice) {
          const priceDiff = Math.abs(product.price.discountedPrice - avgPrice) / avgPrice;
          if (priceDiff <= 0.5) {
            score += 0.1 * (1 - priceDiff);
            reasons.push('Similar price range');
          }
        }

        // Popularity boost
        if (product.analytics && product.analytics.purchases > 10) {
          score += 0.1;
          reasons.push('Popular choice');
        }

        return {
          ...product,
          recommendationScore: score,
          matchPercentage: Math.min(95, Math.round(score * 20)),
          reasons: reasons.slice(0, 2) // Limit reasons
        };
      });

      // Sort by score and return top recommendations
      const finalRecommendations = scoredRecommendations
        .filter(item => item.recommendationScore > 0.1) // Minimum threshold
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

      logger.info(`✅ Generated ${finalRecommendations.length} order-based recommendations`);
      
      return finalRecommendations.map(product => ({
        product: {
          _id: product._id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          price: product.price,
          images: product.images,
          businessType: product.businessType,
          ratings: product.ratings || { average: 4.0, count: 0 },
          inventory: product.inventory || { stock: 100 },
          description: product.description || ''
        },
        score: product.recommendationScore,
        matchPercentage: product.matchPercentage,
        reason: product.reasons.join(' • ') || 'Based on your purchase history',
        type: 'order-based'
      }));

    } catch (error) {
      logger.error('❌ Error generating order-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get popular products as fallback
   */
  async getPopularProducts(limit = 6) {
    try {
      const popularProducts = await Product.find({ isActive: true })
        .sort({ 'analytics.purchases': -1, 'ratings.average': -1 })
        .limit(limit)
        .lean();

      return popularProducts.map(product => ({
        product: {
          _id: product._id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          price: product.price,
          images: product.images,
          businessType: product.businessType,
          ratings: product.ratings || { average: 4.0, count: 0 },
          inventory: product.inventory || { stock: 100 },
          description: product.description || ''
        },
        score: 0.8,
        matchPercentage: 75,
        reason: 'Popular choice',
        type: 'popular'
      }));
    } catch (error) {
      logger.error('❌ Error getting popular products:', error);
      return [];
    }
  }
}

module.exports = new SimpleOrderRecommendationService();