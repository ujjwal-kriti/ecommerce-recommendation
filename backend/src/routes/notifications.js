const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate dynamic notifications
    const notifications = [];

    // Stock alerts for favorite products
    const user = await User.findById(userId).lean();
    if (user.preferences?.categories) {
      const lowStockProducts = await Product.find({
        category: { $in: user.preferences.categories },
        'inventory.stock': { $lt: 10, $gt: 0 },
        isActive: true
      }).limit(5).lean();

      lowStockProducts.forEach(product => {
        notifications.push({
          id: `stock_${product._id}`,
          type: 'stock_alert',
          title: 'Low Stock Alert',
          message: `${product.name} is running low in stock (${product.inventory.stock} left)`,
          productId: product._id,
          priority: 'medium',
          createdAt: new Date()
        });
      });
    }

    // Price drop alerts
    const recentlyViewedProducts = await Product.find({
      'analytics.views': { $gt: 0 },
      'price.discount': { $gt: 0 },
      isActive: true
    }).limit(3).lean();

    recentlyViewedProducts.forEach(product => {
      notifications.push({
        id: `price_${product._id}`,
        type: 'price_drop',
        title: 'Price Drop Alert',
        message: `${product.name} is now available at ${product.price.discount}% off!`,
        productId: product._id,
        priority: 'high',
        createdAt: new Date()
      });
    });

    // New product recommendations
    notifications.push({
      id: 'new_recommendations',
      type: 'recommendations',
      title: 'New Recommendations Available',
      message: 'We have new product recommendations based on your recent purchases',
      priority: 'low',
      createdAt: new Date(),
      action: {
        type: 'navigate',
        url: '/recommendations'
      }
    });

    // Order updates (mock)
    const recentOrders = await require('../models/Order').find({
      userId,
      orderStatus: { $in: ['processing', 'shipped'] }
    }).limit(2).lean();

    recentOrders.forEach(order => {
      notifications.push({
        id: `order_${order._id}`,
        type: 'order_update',
        title: 'Order Update',
        message: `Your order #${order.orderNumber} is now ${order.orderStatus}`,
        orderId: order._id,
        priority: 'high',
        createdAt: order.updatedAt
      });
    });

    // Sort by priority and date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.slice(0, 20), // Limit to 20 notifications
        total: notifications.length,
        unreadCount: notifications.length // In real app, track read status
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    // In a real implementation, you would update the notification read status
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();

    res.json({
      success: true,
      data: user.preferences?.notificationSettings || {
        email: true,
        sms: false,
        whatsapp: false,
        push: true
      }
    });
  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { email, sms, whatsapp, push } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      'preferences.notificationSettings': {
        email: email !== undefined ? email : true,
        sms: sms !== undefined ? sms : false,
        whatsapp: whatsapp !== undefined ? whatsapp : false,
        push: push !== undefined ? push : true
      }
    });

    res.json({
      success: true,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
