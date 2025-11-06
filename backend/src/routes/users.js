const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'businessName', 'businessAddress'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with purchase history
    const user = await User.findById(userId)
      .populate('purchaseHistory.productId', 'name brand price category')
      .lean();

    // Calculate dashboard metrics
    const totalPurchases = user.purchaseHistory?.length || 0;
    const totalSpent = user.purchaseHistory?.reduce((sum, purchase) => 
      sum + (purchase.price * purchase.quantity), 0) || 0;

    const recentPurchases = user.purchaseHistory
      ?.sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5) || [];

    const favoriteCategories = {};
    user.purchaseHistory?.forEach(purchase => {
      if (purchase.productId?.category) {
        favoriteCategories[purchase.productId.category] = 
          (favoriteCategories[purchase.productId.category] || 0) + 1;
      }
    });

    const dashboardData = {
      user: {
        name: user.name,
        businessName: user.businessName,
        businessType: user.businessType,
        memberSince: user.createdAt
      },
      metrics: {
        totalPurchases,
        totalSpent,
        averageOrderValue: totalPurchases > 0 ? (totalSpent / totalPurchases).toFixed(2) : 0
      },
      recentActivity: {
        recentPurchases,
        favoriteCategories: Object.entries(favoriteCategories)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }))
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
