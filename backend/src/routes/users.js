const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const { authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Get all users with purchase history product populated
    const users = await User.find().select('-password').populate('purchaseHistory.productId', 'name').lean();

    const result = users.map(u => {
      // Determine most recent purchase
      const purchases = (u.purchaseHistory || []).slice();
      purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
      const mostRecent = purchases[0]?.productId?.name || null;

      // Determine most frequent product
      const freq = {};
      purchases.forEach(p => {
        const pid = p.productId?._id?.toString();
        if (pid) freq[pid] = (freq[pid] || 0) + p.quantity || 1;
      });
      let mostFreqName = null;
      if (Object.keys(freq).length > 0) {
        const maxPid = Object.entries(freq).sort((a,b) => b[1]-a[1])[0][0];
        const found = purchases.find(p => p.productId?._id?.toString() === maxPid);
        mostFreqName = found?.productId?.name || null;
      }

      // Choose most frequent if count > 1, else most recent
      let recentOrFrequent = mostRecent;
      if (mostFreqName && Object.values(freq).some(c => c > 1)) recentOrFrequent = mostFreqName;

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        recentProductBought: recentOrFrequent
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
