const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get business insights to combat repetitive buying behavior
// @route   GET /api/business-insights/diversification
// @access  Private
router.get('/diversification', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Analyze user's buying patterns
    const orders = await Order.find({ 
      userId, 
      orderStatus: { $in: ['delivered', 'completed'] }
    }).populate('items.productId');

    // Calculate category diversity score
    const categoryMap = new Map();
    const brandMap = new Map();
    let totalSpend = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.productId.category;
        const brand = item.productId.brand;
        const spend = item.quantity * item.price;
        
        categoryMap.set(category, (categoryMap.get(category) || 0) + spend);
        brandMap.set(brand, (brandMap.get(brand) || 0) + spend);
        totalSpend += spend;
      });
    });

    // Calculate diversity metrics
    const categoryDiversity = calculateDiversityIndex(categoryMap, totalSpend);
    const brandDiversity = calculateDiversityIndex(brandMap, totalSpend);
    
    // Get unexplored categories
    const allCategories = await Product.distinct('category', { isActive: true });
    const userCategories = Array.from(categoryMap.keys());
    const unexploredCategories = allCategories.filter(cat => !userCategories.includes(cat));

    // Get opportunity products from unexplored categories
    const opportunityProducts = await Product.find({
      category: { $in: unexploredCategories.slice(0, 3) },
      isActive: true
    }).limit(9);

    res.json({
      success: true,
      data: {
        diversityScore: Math.round((categoryDiversity + brandDiversity) / 2 * 100),
        categoryBreakdown: Array.from(categoryMap.entries()).map(([category, spend]) => ({
          category,
          spend,
          percentage: Math.round((spend / totalSpend) * 100)
        })),
        unexploredOpportunities: unexploredCategories.length,
        recommendedProducts: opportunityProducts,
        insights: generateDiversityInsights(categoryDiversity, brandDiversity, unexploredCategories.length)
      }
    });

  } catch (error) {
    logger.error('Error fetching business insights:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get cost optimization insights
// @route   GET /api/business-insights/cost-optimization
// @access  Private
router.get('/cost-optimization', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's recent purchases
    const recentOrders = await Order.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).populate('items.productId');

    const purchaseMap = new Map();
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId._id.toString();
        if (!purchaseMap.has(productId)) {
          purchaseMap.set(productId, {
            product: item.productId,
            totalQuantity: 0,
            totalSpend: 0,
            avgPrice: 0,
            orderCount: 0
          });
        }
        const data = purchaseMap.get(productId);
        data.totalQuantity += item.quantity;
        data.totalSpend += (item.quantity * item.price);
        data.orderCount += 1;
        data.avgPrice = data.totalSpend / data.totalQuantity;
      });
    });

    // Find better alternatives for frequently bought items
    const frequentItems = Array.from(purchaseMap.values())
      .filter(item => item.orderCount >= 3)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    const optimizationSuggestions = [];
    for (const item of frequentItems) {
      const alternatives = await Product.find({
        category: item.product.category,
        brand: { $ne: item.product.brand },
        'price.discountedPrice': { $lt: item.avgPrice },
        isActive: true
      }).limit(3).sort({ rating: -1 });

      if (alternatives.length > 0) {
        const bestAlternative = alternatives[0];
        const potentialSavings = (item.avgPrice - bestAlternative.price.discountedPrice) * item.totalQuantity;
        
        optimizationSuggestions.push({
          currentProduct: item.product,
          currentSpend: item.totalSpend,
          alternative: bestAlternative,
          potentialSavings: Math.round(potentialSavings),
          savingsPercentage: Math.round(((item.avgPrice - bestAlternative.price.discountedPrice) / item.avgPrice) * 100)
        });
      }
    }

    const totalPotentialSavings = optimizationSuggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0);

    res.json({
      success: true,
      data: {
        totalPotentialSavings: Math.round(totalPotentialSavings),
        optimizationSuggestions,
        quarterlyProjection: Math.round(totalPotentialSavings * 4),
        impactScore: Math.min(100, Math.round((totalPotentialSavings / 10000) * 100))
      }
    });

  } catch (error) {
    logger.error('Error fetching cost optimization insights:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to calculate diversity index (Simpson's Diversity Index)
function calculateDiversityIndex(dataMap, total) {
  if (total === 0) return 0;
  let sum = 0;
  for (const value of dataMap.values()) {
    const proportion = value / total;
    sum += proportion * proportion;
  }
  return 1 - sum; // Higher values indicate more diversity
}

function generateDiversityInsights(categoryDiversity, brandDiversity, unexploredCount) {
  const insights = [];
  
  if (categoryDiversity < 0.3) {
    insights.push({
      type: 'warning',
      message: 'Your purchases are concentrated in few categories. Explore more product types to discover better deals.',
      action: 'View category recommendations'
    });
  }

  if (brandDiversity < 0.2) {
    insights.push({
      type: 'info',
      message: 'You\'re loyal to specific brands. Consider trying alternatives for potential cost savings.',
      action: 'Compare brand alternatives'
    });
  }

  if (unexploredCount > 5) {
    insights.push({
      type: 'opportunity',
      message: `${unexploredCount} product categories remain unexplored. These may contain relevant products for your business.`,
      action: 'Explore new categories'
    });
  }

  return insights;
}

module.exports = router;