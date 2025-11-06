const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mlService = require('../services/mlService');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeRange = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get order analytics
    const orders = await Order.find({
      userId,
      createdAt: { $gte: startDate }
    }).lean();

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount.grandTotal, 0);

    // Monthly spending pattern
    const monthlySpending = {};
    orders.forEach(order => {
      const month = order.createdAt.toISOString().substr(0, 7); // YYYY-MM
      monthlySpending[month] = (monthlySpending[month] || 0) + order.totalAmount.grandTotal;
    });

    // Category preferences
    const categorySpending = {};
    for (const order of orders) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId).lean();
        if (product) {
          categorySpending[product.category] = 
            (categorySpending[product.category] || 0) + item.total;
        }
      }
    }

    // Recommendation effectiveness
    const user = await User.findById(userId).lean();
    const recommendations = user.recommendations || [];
    const totalRecommendations = recommendations.length;
    const clickedRecommendations = recommendations.filter(r => r.clicked).length;
    const purchasedRecommendations = recommendations.filter(r => r.purchased).length;

    const analytics = {
      orderMetrics: {
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        averageOrderValue: totalOrders > 0 ? parseFloat((totalSpent / totalOrders).toFixed(2)) : 0
      },
      spendingPatterns: {
        monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({
          month,
          amount: parseFloat(amount.toFixed(2))
        })).sort((a, b) => a.month.localeCompare(b.month)),
        categorySpending: Object.entries(categorySpending)
          .sort(([,a], [,b]) => b - a)
          .map(([category, amount]) => ({
            category,
            amount: parseFloat(amount.toFixed(2))
          }))
      },
      recommendationMetrics: {
        totalRecommendations,
        clickThroughRate: totalRecommendations > 0 ? 
          parseFloat((clickedRecommendations / totalRecommendations * 100).toFixed(2)) : 0,
        conversionRate: totalRecommendations > 0 ? 
          parseFloat((purchasedRecommendations / totalRecommendations * 100).toFixed(2)) : 0
      },
      timeRange: parseInt(timeRange)
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get product performance analytics
// @route   GET /api/analytics/products
// @access  Private
router.get('/products', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Top performing products
    const topProducts = await Product.find({ isActive: true })
      .sort({ 'analytics.purchases': -1 })
      .limit(parseInt(limit))
      .select('name brand category analytics price')
      .lean();

    // Most viewed products
    const mostViewed = await Product.find({ isActive: true })
      .sort({ 'analytics.views': -1 })
      .limit(parseInt(limit))
      .select('name brand category analytics')
      .lean();

    res.json({
      success: true,
      data: {
        topProducts,
        mostViewed
      }
    });
  } catch (error) {
    logger.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get ML model status and performance
// @route   GET /api/analytics/ml-status
// @access  Private
router.get('/ml-status', protect, async (req, res) => {
  try {
    const modelStatus = mlService.getModelStatus();

    res.json({
      success: true,
      data: modelStatus
    });
  } catch (error) {
    logger.error('ML status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
