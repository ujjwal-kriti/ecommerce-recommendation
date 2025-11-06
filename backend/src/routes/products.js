const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      businessType,
      minPrice,
      maxPrice,
      minRating,
      discountOnly,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      inStock = false
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (inStock === 'true') {
      query['inventory.stock'] = { $gt: 0 };
    }

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // Business type filtering - filter by businessType field directly
    if (businessType) {
      query.businessType = businessType;
    }

    if (minPrice || maxPrice) {
      query['price.discountedPrice'] = {};
      if (minPrice) query['price.discountedPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.discountedPrice'].$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query['ratings.average'] = { $gte: parseFloat(minRating) };
    }

    // Discount filter - only products with discounts
    if (discountOnly === 'true') {
      query.$expr = {
        $gt: ['$price.mrp', '$price.discountedPrice']
      };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Enhanced sort options
    const sortOptions = {};
    if (sortBy === 'price.discountedPrice') {
      sortOptions['price.discountedPrice'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'ratings.average') {
      sortOptions['ratings.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'analytics.purchases') {
      sortOptions['analytics.purchases'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.analytics.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get product categories
// @route   GET /api/products/meta/categories
// @access  Private
router.get('/meta/categories', protect, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    const brands = await Product.distinct('brand', { isActive: true });

    const priceRange = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price.discountedPrice' },
          maxPrice: { $max: '$price.discountedPrice' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.sort(),
        brands: brands.sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 }
      }
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Search products
// @route   POST /api/products/search
// @access  Private
router.post('/search', protect, async (req, res) => {
  try {
    const { query, filters = {}, page = 1, limit = 20 } = req.body;

    const searchQuery = { isActive: true };

    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      searchQuery.category = { $in: filters.categories };
    }

    if (filters.brands && filters.brands.length > 0) {
      searchQuery.brand = { $in: filters.brands };
    }

    if (filters.priceRange) {
      searchQuery['price.discountedPrice'] = {
        $gte: filters.priceRange.min || 0,
        $lte: filters.priceRange.max || 999999
      };
    }

    const products = await Product.find(searchQuery)
      .sort(query ? { score: { $meta: 'textScore' } } : { name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        products,
        total,
        query,
        filters
      }
    });
  } catch (error) {
    logger.error('Product search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search error'
    });
  }
});

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Private
router.get('/meta/trending', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trending = await Product.find({
      isActive: true,
      'inventory.stock': { $gt: 0 }
    })
    .sort({
      'analytics.trendingScore': -1,
      'analytics.purchases': -1,
      'analytics.views': -1
    })
    .limit(limit)
    .lean();

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    logger.error('Get trending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Private
router.get('/meta/featured', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const featured = await Product.find({
      isActive: true,
      isFeatured: true,
      'inventory.stock': { $gt: 0 }
    })
    .limit(limit)
    .lean();

    res.json({
      success: true,
      data: featured
    });
  } catch (error) {
    logger.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
