const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    index: true
  },
  brand: {
    type: String,
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    mrp: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  },
  inventory: {
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, default: 10 },
    maxStock: { type: Number, default: 1000 },
    unit: { type: String, required: true } // kg, pieces, liters, etc.
  },
  specifications: {
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    expiryDate: Date,
    batchNumber: String
  },
  images: [String],
  tags: [String],
  features: [String],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  analytics: {
    views: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    lastPurchased: Date,
    trendingScore: { type: Number, default: 0 }
  },
  supplier: {
    name: String,
    contact: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewLaunch: {
    type: Boolean,
    default: false
  },
  businessType: {
    type: String,
    enum: ['pharmacy', 'grocery', 'retail', 'wholesale', 'other'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for text search
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  category: 'text',
  tags: 'text'
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
