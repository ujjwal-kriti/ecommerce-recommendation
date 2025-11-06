const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Track product view
// @route   POST /api/activity/view
// @access  Private
router.post('/view', protect, async (req, res) => {
  try {
    const { productId, viewDuration = 0, source = 'direct' } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add to browsing history
    await User.findByIdAndUpdate(userId, {
      $push: {
        browsingHistory: {
          $each: [{
            productId,
            viewedAt: new Date(),
            viewDuration: parseInt(viewDuration),
            source
          }],
          $slice: -100 // Keep only last 100 views
        }
      },
      $inc: {
        'activityMetrics.totalViews': 1
      },
      $set: {
        'activityMetrics.lastActivity': new Date()
      }
    });

    // Update product analytics
    await Product.findByIdAndUpdate(productId, {
      $inc: {
        'analytics.views': 1
      },
      $set: {
        'analytics.lastViewed': new Date()
      }
    });

    // Update user engagement metrics
    await updateUserEngagementScore(userId);

    res.json({
      success: true,
      message: 'Product view tracked successfully'
    });

  } catch (error) {
    logger.error('Track view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking product view'
    });
  }
});

// @desc    Track search query
// @route   POST /api/activity/search
// @access  Private
router.post('/search', protect, async (req, res) => {
  try {
    const { query, filters = {}, resultsCount = 0 } = req.body;
    const userId = req.user._id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Add to search history
    await User.findByIdAndUpdate(userId, {
      $push: {
        searchHistory: {
          $each: [{
            query: query.toLowerCase(),
            filters,
            resultsCount: parseInt(resultsCount),
            searchedAt: new Date(),
            clickedProducts: []
          }],
          $slice: -50 // Keep only last 50 searches
        }
      },
      $inc: {
        'activityMetrics.totalSearches': 1
      },
      $set: {
        'activityMetrics.lastActivity': new Date()
      }
    });

    // Update user engagement metrics
    await updateUserEngagementScore(userId);

    res.json({
      success: true,
      message: 'Search query tracked successfully'
    });

  } catch (error) {
    logger.error('Track search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search query'
    });
  }
});

// @desc    Track search result click
// @route   POST /api/activity/search-click
// @access  Private
router.post('/search-click', protect, async (req, res) => {
  try {
    const { productId, searchQuery } = req.body;
    const userId = req.user._id;

    if (!productId || !searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and search query are required'
      });
    }

    // Update the latest search entry with clicked product
    await User.updateOne(
      { 
        _id: userId,
        'searchHistory.query': searchQuery.toLowerCase()
      },
      {
        $addToSet: {
          'searchHistory.$.clickedProducts': productId
        }
      }
    );

    res.json({
      success: true,
      message: 'Search click tracked successfully'
    });

  } catch (error) {
    logger.error('Track search click error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search click'
    });
  }
});

// @desc    Get user activity analytics
// @route   GET /api/activity/analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .populate('browsingHistory.productId', 'name category brand price images')
      .populate('searchHistory.clickedProducts', 'name category brand')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate analytics
    const recentViews = user.browsingHistory.slice(-20);
    const recentSearches = user.searchHistory.slice(-10);
    
    // Category preferences from browsing
    const categoryCount = {};
    recentViews.forEach(view => {
      if (view.productId && view.productId.category) {
        categoryCount[view.productId.category] = (categoryCount[view.productId.category] || 0) + 1;
      }
    });

    // Brand preferences from browsing
    const brandCount = {};
    recentViews.forEach(view => {
      if (view.productId && view.productId.brand) {
        brandCount[view.productId.brand] = (brandCount[view.productId.brand] || 0) + 1;
      }
    });

    // Search patterns
    const searchPatterns = recentSearches.map(search => ({
      query: search.query,
      resultsCount: search.resultsCount,
      clickedCount: search.clickedProducts.length,
      searchedAt: search.searchedAt
    }));

    res.json({
      success: true,
      data: {
        activityMetrics: user.activityMetrics,
        recentViews,
        recentSearches: searchPatterns,
        preferences: {
          topCategories: Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5),
          topBrands: Object.entries(brandCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        }
      }
    });

  } catch (error) {
    logger.error('Get activity analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity analytics'
    });
  }
});

// @desc    Update session activity
// @route   POST /api/activity/session
// @access  Private
router.post('/session', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $inc: {
        'activityMetrics.sessionCount': 1
      },
      $set: {
        'activityMetrics.lastActivity': new Date()
      }
    });

    res.json({
      success: true,
      message: 'Session tracked successfully'
    });

  } catch (error) {
    logger.error('Track session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking session'
    });
  }
});

// Helper function to update user engagement score
async function updateUserEngagementScore(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const metrics = user.activityMetrics;
    
    // Calculate engagement score based on various factors
    let engagementScore = 0;
    
    // Views contribution (0-40 points)
    engagementScore += Math.min(40, metrics.totalViews * 0.1);
    
    // Search contribution (0-30 points)
    engagementScore += Math.min(30, metrics.totalSearches * 0.5);
    
    // Session consistency (0-20 points)
    engagementScore += Math.min(20, metrics.sessionCount * 0.2);
    
    // Recent activity bonus (0-10 points)
    if (metrics.lastActivity) {
      const daysSinceActivity = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 1) engagementScore += 10;
      else if (daysSinceActivity < 7) engagementScore += 5;
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        'activityMetrics.engagementScore': Math.round(engagementScore)
      }
    });

  } catch (error) {
    logger.error('Update engagement score error:', error);
  }
}

module.exports = router;