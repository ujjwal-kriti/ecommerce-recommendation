const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const logger = require('../utils/logger');
require('dotenv').config();

// Sample products data
const sampleProducts = [
  {
    name: "Premium Basmati Rice",
    description: "Long grain premium quality basmati rice, perfect for all Indian dishes",
    category: "Food & Beverages",
    subcategory: "Rice & Grains",
    brand: "India Gate",
    sku: "IG-BASMATI-5KG",
    price: { mrp: 650, discountedPrice: 580, discount: 10.77 },
    inventory: { stock: 150, minStock: 20, maxStock: 500, unit: "kg" },
    specifications: { weight: "5kg", expiryDate: new Date(Date.now() + 365*24*60*60*1000) },
    images: [
      "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&h=400&fit=crop&crop=center",
      "https://via.placeholder.com/400x400/FFE4B5/8B4513?text=Premium+Basmati+Rice"
    ],
    tags: ["organic", "premium", "basmati"],
    features: ["Long grain", "Aromatic", "Premium quality"],
    ratings: { average: 4.5, count: 120 },
    analytics: { views: 450, purchases: 89, trendingScore: 85 },
    supplier: { name: "Rice Distributors Ltd", contact: "+91 9876543210" },
    isFeatured: true,
    isNewLaunch: false
  },
  {
    name: "Organic Whole Wheat Flour",
    description: "100% organic whole wheat flour, stone ground for better nutrition",
    category: "Food & Beverages",
    subcategory: "Flour & Grains",
    brand: "Aashirvaad",
    sku: "ASH-WHEAT-10KG",
    price: { mrp: 480, discountedPrice: 425, discount: 11.46 },
    inventory: { stock: 200, minStock: 30, maxStock: 800, unit: "kg" },
    specifications: { weight: "10kg", expiryDate: new Date(Date.now() + 180*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=3",
      "https://via.placeholder.com/400x400/DEB887/8B4513?text=Wheat+Flour"
    ],
    tags: ["organic", "healthy", "stone-ground"],
    features: ["100% organic", "Stone ground", "High fiber"],
    ratings: { average: 4.3, count: 95 },
    analytics: { views: 320, purchases: 67, trendingScore: 78 },
    supplier: { name: "Grain Suppliers Co", contact: "+91 9876543211" },
    isFeatured: false,
    isNewLaunch: true
  },
  {
    name: "Refined Sunflower Oil",
    description: "Pure refined sunflower oil, rich in Vitamin E and perfect for cooking",
    category: "Food & Beverages",
    subcategory: "Cooking Oil",
    brand: "Fortune",
    sku: "FRT-SUNFLOWER-5L",
    price: { mrp: 520, discountedPrice: 485, discount: 6.73 },
    inventory: { stock: 80, minStock: 15, maxStock: 300, unit: "liters" },
    specifications: { weight: "5L", expiryDate: new Date(Date.now() + 540*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=4",
      "https://via.placeholder.com/400x400/FFD700/8B4513?text=Sunflower+Oil"
    ],
    tags: ["refined", "vitamin-e", "healthy"],
    features: ["Rich in Vitamin E", "Heart healthy", "Light taste"],
    ratings: { average: 4.2, count: 156 },
    analytics: { views: 280, purchases: 45, trendingScore: 65 },
    supplier: { name: "Oil Trading Corp", contact: "+91 9876543212" },
    isFeatured: true,
    isNewLaunch: false
  },
  {
    name: "Red Kidney Beans",
    description: "Premium quality rajma beans, rich in protein and fiber",
    category: "Food & Beverages", 
    subcategory: "Pulses & Lentils",
    brand: "Tata Sampann",
    sku: "TS-RAJMA-1KG",
    price: { mrp: 180, discountedPrice: 165, discount: 8.33 },
    inventory: { stock: 120, minStock: 25, maxStock: 400, unit: "kg" },
    specifications: { weight: "1kg", expiryDate: new Date(Date.now() + 730*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=5",
      "https://via.placeholder.com/400x400/DC143C/FFFFFF?text=Kidney+Beans"
    ],
    tags: ["protein", "fiber", "healthy"],
    features: ["High protein", "Rich in fiber", "Premium quality"],
    ratings: { average: 4.4, count: 78 },
    analytics: { views: 190, purchases: 34, trendingScore: 58 },
    supplier: { name: "Pulse Traders", contact: "+91 9876543213" },
    isFeatured: false,
    isNewLaunch: false
  },
  {
    name: "Organic Turmeric Powder",
    description: "Pure organic turmeric powder with high curcumin content",
    category: "Food & Beverages",
    subcategory: "Spices",
    brand: "Everest",
    sku: "EVR-TURMERIC-500G",
    price: { mrp: 120, discountedPrice: 108, discount: 10 },
    inventory: { stock: 300, minStock: 50, maxStock: 1000, unit: "grams" },
    specifications: { weight: "500g", expiryDate: new Date(Date.now() + 1095*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=6",
      "https://via.placeholder.com/400x400/FFD700/8B4513?text=Turmeric+Powder"
    ],
    tags: ["organic", "curcumin", "medicinal"],
    features: ["High curcumin", "Organic", "Anti-inflammatory"],
    ratings: { average: 4.6, count: 210 },
    analytics: { views: 510, purchases: 125, trendingScore: 95 },
    supplier: { name: "Spice Masters", contact: "+91 9876543214" },
    isFeatured: true,
    isNewLaunch: false
  },
  {
    name: "Almonds 500g",
    description: "Premium California almonds, rich in protein and healthy fats",
    category: "Groceries",
    subcategory: "Dry Fruits & Nuts",
    brand: "NuttyDelight",
    sku: "ND-ALMONDS-500G",
    price: { mrp: 565, discountedPrice: 480, discount: 15 },
    inventory: { stock: 85, minStock: 10, maxStock: 200, unit: "pieces" },
    specifications: { weight: "500g", expiryDate: new Date(Date.now() + 365*24*60*60*1000) },
    images: [
      "https://images.unsplash.com/photo-1599599810694-57a2ca8276a8?w=400&h=400&fit=crop&crop=center",
      "https://via.placeholder.com/400x400/DEB887/8B4513?text=Almonds+500g"
    ],
    tags: ["premium", "california", "protein", "healthy"],
    features: ["High protein", "Rich in healthy fats", "Premium quality"],
    ratings: { average: 4.3, count: 110 },
    analytics: { views: 320, purchases: 68, trendingScore: 75 },
    supplier: { name: "Dry Fruit Traders", contact: "+91 9876543215" },
    isFeatured: false,
    isNewLaunch: false
  },
  {
    name: "Basmati Rice 5kg",
    description: "Premium long grain basmati rice, aromatic and fluffy",
    category: "Groceries", 
    subcategory: "Rice & Grains",
    brand: "GoldenGrain",
    sku: "GG-BASMATI-5KG",
    price: { mrp: 485, discountedPrice: 407, discount: 16 },
    inventory: { stock: 164, minStock: 20, maxStock: 500, unit: "pieces" },
    specifications: { weight: "5kg", expiryDate: new Date(Date.now() + 730*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=2",
      "https://via.placeholder.com/400x400/F5DEB3/8B4513?text=Basmati+Rice+5kg"
    ],
    tags: ["premium", "long grain", "aromatic", "basmati"],
    features: ["Long grain", "Aromatic", "Fluffy texture"],
    ratings: { average: 4.2, count: 114 },
    analytics: { views: 450, purchases: 89, trendingScore: 85 },
    supplier: { name: "Rice Distributors Ltd", contact: "+91 9876543216" },
    isFeatured: true,
    isNewLaunch: false
  },
  {
    name: "Brown Bread Loaf",
    description: "Fresh whole wheat brown bread, rich in fiber and nutrients",
    category: "Groceries",
    subcategory: "Bakery",
    brand: "BreadBasket", 
    sku: "BB-BROWN-LOAF",
    price: { mrp: 45, discountedPrice: 39, discount: 13 },
    inventory: { stock: 177, minStock: 30, maxStock: 300, unit: "pieces" },
    specifications: { weight: "400g", expiryDate: new Date(Date.now() + 3*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=8",
      "https://via.placeholder.com/400x400/D2B48C/8B4513?text=Brown+Bread"
    ],
    tags: ["whole wheat", "fiber", "fresh", "healthy"],
    features: ["Rich in fiber", "Whole wheat", "Fresh daily"],
    ratings: { average: 3.9, count: 78 },
    analytics: { views: 290, purchases: 55, trendingScore: 62 },
    supplier: { name: "Fresh Bakery Co", contact: "+91 9876543217" },
    isFeatured: false,
    isNewLaunch: true
  },
  {
    name: "Fresh Milk 1L",
    description: "Fresh full cream milk, rich in calcium and proteins",
    category: "Groceries",
    subcategory: "Dairy",
    brand: "DairyFresh",
    sku: "DF-MILK-1L",
    price: { mrp: 65, discountedPrice: 53, discount: 18 },
    inventory: { stock: 230, minStock: 50, maxStock: 400, unit: "pieces" },
    specifications: { volume: "1L", expiryDate: new Date(Date.now() + 2*24*60*60*1000) },
    images: [
      "https://picsum.photos/400/400?random=9",
      "https://via.placeholder.com/400x400/F0F8FF/4169E1?text=Fresh+Milk+1L"
    ],
    tags: ["fresh", "full cream", "calcium", "protein"],
    features: ["Full cream", "Rich in calcium", "Fresh daily"],
    ratings: { average: 4.4, count: 150 },
    analytics: { views: 380, purchases: 95, trendingScore: 88 },
    supplier: { name: "Dairy Products Ltd", contact: "+91 9876543218" },
    isFeatured: true,
    isNewLaunch: false
  }
];

// Sample users data
const sampleUsers = [
  {
    name: "Rajesh Gupta",
    email: "rajesh@grocery.com",
    password: "password123",
    businessType: "grocery",
    businessName: "Gupta General Store",
    phone: "+91 9876543210",
    businessAddress: {
      street: "123 Main Street",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India"
    },
    preferences: {
      categories: ["Food & Beverages"],
      brands: ["India Gate", "Aashirvaad"],
      priceRange: { min: 100, max: 1000 },
      notificationSettings: { email: true, sms: true, whatsapp: false, push: true }
    }
  },
  {
    name: "Priya Sharma",
    email: "priya@restaurant.com", 
    password: "password123",
    businessType: "restaurant",
    businessName: "Sharma's Kitchen",
    phone: "+91 9876543211",
    businessAddress: {
      street: "456 Food Court",
      city: "Mumbai",
      state: "Maharashtra", 
      zipCode: "400001",
      country: "India"
    },
    preferences: {
      categories: ["Food & Beverages"],
      brands: ["Everest", "Fortune"],
      priceRange: { min: 200, max: 2000 },
      notificationSettings: { email: true, sms: false, whatsapp: true, push: true }
    }
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qwipo-recommendations', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed products
const seedProducts = async () => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    logger.info('Products seeded successfully');
  } catch (error) {
    logger.error('Error seeding products:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    await User.deleteMany({});

    // Hash passwords
    for (let user of sampleUsers) {
      user.password = await bcrypt.hash(user.password, 12);
    }

    await User.insertMany(sampleUsers);
    logger.info('Users seeded successfully');
  } catch (error) {
    logger.error('Error seeding users:', error);
  }
};

// Seed sample orders
const seedOrders = async () => {
  try {
    await Order.deleteMany({});

    const users = await User.find({});
    const products = await Product.find({});

    const sampleOrders = [];

    // Create sample orders for each user
    for (let user of users) {
      for (let i = 0; i < 3; i++) {
        const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

        const items = randomProducts.map(product => ({
          productId: product._id,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: product.price.discountedPrice,
          discount: 0,
          total: product.price.discountedPrice * (Math.floor(Math.random() * 5) + 1)
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.18;
        const shipping = subtotal > 1000 ? 0 : 50;
        const grandTotal = subtotal + tax + shipping;

        sampleOrders.push({
          userId: user._id,
          items,
          totalAmount: {
            subtotal,
            tax,
            shipping,
            grandTotal
          },
          shippingAddress: user.businessAddress,
          paymentMethod: ['cash', 'credit', 'upi'][Math.floor(Math.random() * 3)],
          orderStatus: ['delivered', 'processing', 'shipped'][Math.floor(Math.random() * 3)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      }
    }

    await Order.insertMany(sampleOrders);
    logger.info('Orders seeded successfully');
  } catch (error) {
    logger.error('Error seeding orders:', error);
  }
};

// Main seeder function
const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info('Starting database seeding...');

    await seedProducts();
    await seedUsers(); 
    await seedOrders();

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedProducts, seedUsers, seedOrders };
