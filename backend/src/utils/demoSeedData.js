const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('./logger');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Create demo users
    const demoUsers = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@demoshop.com',
        password: await bcrypt.hash('password123', 10),
        businessName: 'Kumar General Store',
        businessType: 'retailer',
        phone: '+91-9876543210',
        address: {
          street: '123 Market Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        }
      },
      {
        name: 'Priya Sharma',
        email: 'priya@quickmart.com',
        password: await bcrypt.hash('password123', 10),
        businessName: 'QuickMart Superstore',
        businessType: 'distributor',
        phone: '+91-9876543211',
        address: {
          street: '456 Commerce Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        }
      }
    ];

    const users = await User.insertMany(demoUsers);
    logger.info('Demo users created');

    // Enhanced product categories for better diversity analysis
    const productCategories = [
      'Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports',
      'Groceries', 'Beauty', 'Automotive', 'Toys', 'Health',
      'Office Supplies', 'Tools', 'Music', 'Kitchen', 'Pet Supplies'
    ];

    const brands = ['Samsung', 'Apple', 'Sony', 'LG', 'HP', 'Dell', 'Nike', 'Adidas', 'Puma', 'Reebok'];

    // Create diverse products
    const products = [];
    for (let i = 0; i < 100; i++) {
      const category = productCategories[Math.floor(Math.random() * productCategories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const basePrice = Math.floor(Math.random() * 5000) + 500;
      const discount = Math.floor(Math.random() * 20) + 5;
      const discountedPrice = Math.floor(basePrice * (1 - discount / 100));

      products.push({
        name: `${brand} ${category} Product ${i + 1}`,
        description: `High-quality ${category.toLowerCase()} product from ${brand}. Perfect for businesses looking for reliable and efficient solutions.`,
        category: category,
        subcategory: `${category} Sub`,
        brand: brand,
        sku: `SKU${(i + 1).toString().padStart(3, '0')}`,
        price: {
          original: basePrice,
          discountedPrice: discountedPrice,
          currency: 'INR'
        },
        inventory: {
          quantity: Math.floor(Math.random() * 100) + 50,
          reserved: Math.floor(Math.random() * 20),
          threshold: 10
        },
        images: [`https://picsum.photos/400/300?random=${i + 1}`],
        specifications: {
          weight: `${Math.floor(Math.random() * 5) + 1} kg`,
          dimensions: `${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 50) + 10} cm`,
          color: ['Red', 'Blue', 'Green', 'Black', 'White'][Math.floor(Math.random() * 5)],
          material: 'Premium Quality'
        },
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
        reviewCount: Math.floor(Math.random() * 200) + 10,
        tags: [category.toLowerCase(), brand.toLowerCase(), 'popular', 'new'],
        isActive: true,
        isFeatured: Math.random() > 0.7,
        vendor: {
          name: `${brand} Official Store`,
          id: 'vendor_' + Math.floor(Math.random() * 10) + 1,
          rating: Math.round((Math.random() * 1 + 4) * 10) / 10
        }
      });
    }

    const createdProducts = await Product.insertMany(products);
    logger.info('Demo products created');

    // Create orders that show repetitive buying behavior (for demo)
    const orders = [];
    const user1 = users[0];
    
    // Create orders with repetitive patterns (same categories/brands)
    const repetitiveCategories = ['Electronics', 'Groceries', 'Office Supplies']; // User 1 mostly buys from these
    const repetitiveBrands = ['Samsung', 'Sony', 'HP']; // User 1 prefers these brands
    
    for (let i = 0; i < 15; i++) {
      // Select products from repetitive categories to show the problem
      const categoryFilter = repetitiveCategories[Math.floor(Math.random() * repetitiveCategories.length)];
      const brandFilter = repetitiveBrands[Math.floor(Math.random() * repetitiveBrands.length)];
      
      const availableProducts = createdProducts.filter(p => 
        p.category === categoryFilter && p.brand === brandFilter
      );
      
      if (availableProducts.length > 0) {
        const selectedProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
        
        orders.push({
          userId: user1._id,
          orderNumber: `ORD-${Date.now()}-${i}`,
          items: [{
            productId: selectedProduct._id,
            quantity: quantity,
            price: selectedProduct.price.discountedPrice
          }],
          totalAmount: selectedProduct.price.discountedPrice * quantity,
          orderStatus: ['delivered', 'completed'][Math.floor(Math.random() * 2)],
          paymentStatus: 'paid',
          shippingAddress: user1.address,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }

    // Add a few diverse orders to show potential
    const diverseCategories = ['Beauty', 'Sports', 'Kitchen', 'Tools'];
    for (let i = 0; i < 5; i++) {
      const categoryFilter = diverseCategories[Math.floor(Math.random() * diverseCategories.length)];
      const availableProducts = createdProducts.filter(p => p.category === categoryFilter);
      
      if (availableProducts.length > 0) {
        const selectedProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        
        orders.push({
          userId: user1._id,
          orderNumber: `ORD-${Date.now()}-${i + 15}`,
          items: [{
            productId: selectedProduct._id,
            quantity: quantity,
            price: selectedProduct.price.discountedPrice
          }],
          totalAmount: selectedProduct.price.discountedPrice * quantity,
          orderStatus: 'delivered',
          paymentStatus: 'paid',
          shippingAddress: user1.address,
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }

    await Order.insertMany(orders);
    logger.info('Demo orders created with repetitive patterns');

    logger.info('🎯 Seed data created successfully!');
    logger.info('📊 Demo scenario:');
    logger.info('- User shows repetitive buying behavior (Electronics, Groceries, Office Supplies)');
    logger.info('- Prefers specific brands (Samsung, Sony, HP)');
    logger.info('- Has unexplored categories (Beauty, Sports, Kitchen, etc.)');
    logger.info('- Perfect for demonstrating Business Intelligence features!');
    
  } catch (error) {
    logger.error('Error seeding data:', error);
    throw error;
  }
};

// Seed trending data for better recommendations
const seedTrendingData = async () => {
  try {
    // Update some products to be trending (high sales simulation)
    const trendingProducts = await Product.find({
      category: { $in: ['Electronics', 'Beauty', 'Sports'] }
    }).limit(10);

    for (const product of trendingProducts) {
      product.reviewCount = Math.floor(Math.random() * 500) + 200; // High review count
      product.rating = Math.round((Math.random() * 0.5 + 4.5) * 10) / 10; // High rating
      product.isFeatured = true;
      await product.save();
    }

    logger.info('Trending products updated');
  } catch (error) {
    logger.error('Error updating trending data:', error);
  }
};

module.exports = { seedData, seedTrendingData };