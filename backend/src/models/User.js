const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  businessType: {
    type: String,
    enum: ['grocery', 'pharmacy', 'restaurant', 'retail', 'wholesale', 'other'],
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  phone: {
    type: String,
    required: true
  },
  preferences: {
    categories: [String],
    brands: [String],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100000 }
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  purchaseHistory: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
    date: { type: Date, default: Date.now }
  }],
  // Enhanced user behavior tracking
  browsingHistory: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now },
    viewDuration: { type: Number, default: 0 }, // in seconds
    source: { type: String, enum: ['search', 'recommendation', 'category', 'direct'], default: 'direct' }
  }],
  searchHistory: [{
    query: String,
    filters: {
      category: String,
      brand: String,
      priceRange: {
        min: Number,
        max: Number
      }
    },
    resultsCount: Number,
    searchedAt: { type: Date, default: Date.now },
    clickedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  }],
  activityMetrics: {
    totalViews: { type: Number, default: 0 },
    totalSearches: { type: Number, default: 0 },
    avgViewDuration: { type: Number, default: 0 },
    favoriteCategories: [String],
    favoriteBrands: [String],
    sessionCount: { type: Number, default: 0 },
    lastActivity: Date,
    engagementScore: { type: Number, default: 0 }
  },
  recommendations: [{
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    reason: String,
    score: Number,
    createdAt: { type: Date, default: Date.now },
    clicked: { type: Boolean, default: false },
    purchased: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
