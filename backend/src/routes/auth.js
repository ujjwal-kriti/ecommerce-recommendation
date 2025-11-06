const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  businessType: Joi.string().valid('grocery', 'pharmacy', 'restaurant', 'retail', 'wholesale', 'other').required(),
  businessName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(10).max(15).required(),
  businessAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India')
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, password, businessType, businessName, phone, businessAddress } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      businessType,
      businessName,
      phone,
      businessAddress
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          businessType: user.businessType,
          businessName: user.businessName
        }
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          businessType: user.businessType,
          businessName: user.businessName,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.preferences) {
      user.preferences = { ...user.preferences, ...req.body.preferences };
      await user.save();
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Seed business-specific products (Development only)
// @route   POST /api/auth/seed-business-products
// @access  Public
router.post('/seed-business-products', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production'
      });
    }

    const { seedBusinessProducts } = require('../utils/businessProductSeeder');
    const products = await seedBusinessProducts();

    res.json({
      success: true,
      message: `Successfully seeded ${products.length} business-specific products`,
      data: {
        totalProducts: products.length,
        productsByBusiness: {
          pharmacy: products.filter(p => p.businessType === 'pharmacy').length,
          grocery: products.filter(p => p.businessType === 'grocery').length,
          restaurant: products.filter(p => p.businessType === 'restaurant').length,
          retail: products.filter(p => p.businessType === 'retail').length,
          wholesale: products.filter(p => p.businessType === 'wholesale').length,
          general: products.filter(p => !p.businessType).length
        }
      }
    });
  } catch (error) {
    logger.error('Seed business products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding products',
      error: error.message
    });
  }
});

module.exports = router;
