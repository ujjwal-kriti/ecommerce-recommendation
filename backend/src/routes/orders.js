const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Validate and calculate order totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found or inactive`
        });
      }

      if (product.inventory.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price.discountedPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price.discountedPrice,
        discount: item.discount || 0,
        total: itemTotal
      });
    }

    // Calculate tax and total
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    const grandTotal = subtotal + tax + shipping;

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      items: validatedItems,
      totalAmount: {
        subtotal,
        tax,
        shipping,
        grandTotal
      },
      shippingAddress: shippingAddress || req.user.businessAddress,
      paymentMethod,
      notes
    });

    // Update product inventory and analytics
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          'inventory.stock': -item.quantity,
          'analytics.purchases': item.quantity
        },
        $set: {
          'analytics.lastPurchased': new Date()
        }
      });
    }

    // Update user purchase history
    const purchaseHistory = validatedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      date: new Date()
    }));

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        purchaseHistory: { $each: purchaseHistory }
      }
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name brand images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('items.productId', 'name brand images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Cancel an order (user can cancel own order if not delivered)
// @route   POST /api/orders/:id/cancel
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only owner or admin can cancel
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Restock products (best-effort)
    try {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { 'inventory.stock': item.quantity } });
      }
    } catch (e) {
      logger.warn('Failed to restock products after cancellation', e);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private (owner) or Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only owner or admin can delete
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Prevent deleting delivered orders by non-admins
    if (order.orderStatus === 'delivered' && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete a delivered order' });
    }

    await Order.deleteOne({ _id: order._id });

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    logger.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
