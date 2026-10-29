const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mlService = require('../services/mlService');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Admin summary (counts)
// @route   GET /api/analytics/admin/summary
// @access  Admin
router.get('/admin/summary', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const now = new Date();
    const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const ordersLast30 = await Order.countDocuments({ createdAt: { $gte: start30 } });
    const ordersLast365 = await Order.countDocuments({ createdAt: { $gte: start365 } });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        ordersLast30,
        ordersLast365
      }
    });
  } catch (error) {
    logger.error('Admin summary error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
    // For normal users we compute analytics for their orders only.
    // For admins, return site-wide analytics (across all orders) so admin dashboard shows overall totals.
    const orderQuery = {
      createdAt: { $gte: startDate }
    };

    if (!req.user || req.user.role !== 'admin') {
      orderQuery.userId = userId;
    }

    const orders = await Order.find(orderQuery).lean();

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

// @desc    Get order counts grouped by user
// @route   GET /api/analytics/orders-by-user
// @access  Admin
router.get('/orders-by-user', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 100, days, timeRange } = req.query;

    // Allow an optional days/timeRange parameter to filter orders within a timeframe (e.g., ?days=7)
    const daysInt = parseInt(days || timeRange || '0', 10);
    let startDate = null;
    if (!isNaN(daysInt) && daysInt > 0) {
      const now = new Date();
      startDate = new Date(now.getTime() - daysInt * 24 * 60 * 60 * 1000);
    }

    // Aggregate orders by userId and lookup user info
    const pipeline = [];

    if (startDate) {
      pipeline.push({ $match: { createdAt: { $gte: startDate } } });
    }

    pipeline.push(
      { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
      { $sort: { orderCount: -1 } },
      { $limit: parseInt(limit, 10) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: { $ifNull: ['$user.name', ''] },
          email: { $ifNull: ['$user.email', ''] },
          orderCount: 1
        }
      }
    );

    const result = await Order.aggregate(pipeline);

    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Orders by user aggregation error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
