const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('./logger');

const businessSpecificProducts = {
  pharmacy: [
    // Medicines
    { name: 'Paracetamol 500mg Tablets', brand: 'MediCare', price: 45, description: 'Pain relief and fever reducer tablets. Pack of 20 tablets.', subcategory: 'Pain Relief', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    { name: 'Ibuprofen 400mg Tablets', brand: 'HealthPlus', price: 85, description: 'Anti-inflammatory pain relief medication. Pack of 30 tablets.', subcategory: 'Pain Relief', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop' },
    { name: 'Cough Syrup 100ml', brand: 'MediCare', price: 125, description: 'Effective cough relief syrup for dry and wet cough.', subcategory: 'Cough & Cold', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop' },
    { name: 'Vitamin D3 Capsules', brand: 'NutriHealth', price: 235, description: 'Essential vitamin D3 supplements. Pack of 60 capsules.', subcategory: 'Vitamins', image: 'https://images.unsplash.com/photo-1550572017-bea3d86458b5?w=400&h=300&fit=crop' },
    { name: 'Calcium Tablets', brand: 'BoneStrong', price: 195, description: 'Calcium carbonate tablets for bone health. Pack of 30.', subcategory: 'Vitamins', image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop' },
    { name: 'Antiseptic Liquid 500ml', brand: 'SafeGuard', price: 165, description: 'Antiseptic solution for wound cleaning and disinfection.', subcategory: 'First Aid', image: 'https://images.unsplash.com/photo-1585435557343-3b092031e06e?w=400&h=300&fit=crop' },
    { name: 'Digital Thermometer', brand: 'TempCheck', price: 285, description: 'Fast and accurate digital thermometer with LCD display.', subcategory: 'Medical Devices', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop' },
    { name: 'Blood Pressure Monitor', brand: 'CardioCheck', price: 2850, description: 'Automatic digital blood pressure monitor with memory.', subcategory: 'Medical Devices', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop' },
    { name: 'Glucose Test Strips', brand: 'DiabCare', price: 450, description: 'Blood glucose test strips. Pack of 50 strips.', subcategory: 'Diabetes Care', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop' },
    { name: 'Hand Sanitizer 500ml', brand: 'CleanHands', price: 145, description: '70% alcohol-based hand sanitizer with moisturizer.', subcategory: 'Hygiene', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop' },
    { name: 'Surgical Masks (Pack of 50)', brand: 'MedSafe', price: 285, description: '3-ply disposable surgical masks with ear loops.', subcategory: 'PPE', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop' },
    { name: 'Latex Gloves (Pack of 100)', brand: 'SafeTouch', price: 385, description: 'Powder-free latex examination gloves.', subcategory: 'PPE', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop' },
    { name: 'Insulin Syringes (Pack of 10)', brand: 'DiabCare', price: 185, description: 'Sterile insulin syringes with ultra-fine needles.', subcategory: 'Diabetes Care', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop' },
    { name: 'Pregnancy Test Kit', brand: 'QuickTest', price: 95, description: 'Accurate home pregnancy test kit with easy reading.', subcategory: 'Diagnostics', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop' },
    { name: 'Baby Formula 400g', brand: 'BabyNutri', price: 485, description: 'Complete nutrition baby formula powder for 0-6 months.', subcategory: 'Baby Care', image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop' }
  ],
  
  grocery: [
    // Food & Beverages
    { name: 'Basmati Rice 5kg', brand: 'GoldenGrain', price: 485, description: 'Premium aged basmati rice with authentic aroma and taste.', subcategory: 'Staples', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
    { name: 'Whole Wheat Flour 5kg', brand: 'FreshMill', price: 285, description: 'Fresh ground whole wheat flour, rich in fiber and nutrients.', subcategory: 'Staples', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop' },
    { name: 'Refined Oil 1L', brand: 'PureDrop', price: 165, description: 'Heart-healthy refined cooking oil with vitamin E.', subcategory: 'Cooking Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop' },
    { name: 'Organic Honey 500g', brand: 'PureNature', price: 385, description: 'Raw organic honey with natural enzymes and antioxidants.', subcategory: 'Sweeteners', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop' },
    { name: 'Green Tea Bags (Pack of 50)', brand: 'LeafFresh', price: 245, description: 'Premium green tea bags with natural antioxidants.', subcategory: 'Beverages', image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&h=300&fit=crop' },
    { name: 'Almonds 500g', brand: 'NuttyDelight', price: 565, description: 'Premium California almonds, rich in protein and healthy fats.', subcategory: 'Dry Fruits', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop' },
    { name: 'Toor Dal 1kg', brand: 'PulseMart', price: 185, description: 'High-quality toor dal, excellent source of protein.', subcategory: 'Pulses', image: 'https://images.unsplash.com/photo-1596097900419-9f5bff87ed45?w=400&h=300&fit=crop' },
    { name: 'Himalayan Pink Salt 1kg', brand: 'PureSalt', price: 125, description: 'Natural Himalayan pink salt with 84 trace minerals.', subcategory: 'Spices', image: 'https://images.unsplash.com/photo-1586725927621-1fb77d885b7e?w=400&h=300&fit=crop' },
    { name: 'Turmeric Powder 200g', brand: 'SpiceKing', price: 185, description: 'Pure organic turmeric powder with high curcumin content.', subcategory: 'Spices', image: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=400&h=300&fit=crop' },
    { name: 'Fresh Milk 1L', brand: 'DairyFresh', price: 65, description: 'Fresh full cream milk, rich in calcium and proteins.', subcategory: 'Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop' },
    { name: 'Brown Bread Loaf', brand: 'BreadBasket', price: 45, description: 'Whole wheat brown bread, high in fiber and nutrients.', subcategory: 'Bakery', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop' },
    { name: 'Organic Eggs (Pack of 12)', brand: 'FarmFresh', price: 95, description: 'Free-range organic eggs from healthy hens.', subcategory: 'Dairy', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop' },
    { name: 'Maggi Noodles (Pack of 12)', brand: 'Nestle', price: 185, description: 'Delicious instant noodles with masala seasoning.', subcategory: 'Ready to Eat', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop' },
    { name: 'Parle-G Biscuits (Pack of 6)', brand: 'Parle', price: 225, description: 'Classic glucose biscuits perfect for tea time.', subcategory: 'Snacks', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop' },
    { name: 'Horlicks 500g', brand: 'Horlicks', price: 285, description: 'Nutritious malted health drink for all ages.', subcategory: 'Health Drinks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop' }
  ],

  restaurant: [
    // Kitchen Equipment & Supplies
    { name: 'Commercial Gas Stove 4 Burner', brand: 'ChefMaster', price: 15850, description: 'Heavy-duty 4-burner gas stove for commercial kitchens.', subcategory: 'Cooking Equipment', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Stainless Steel Pressure Cooker 10L', brand: 'KitchenPro', price: 2850, description: 'Large capacity pressure cooker for bulk cooking.', subcategory: 'Cookware', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Professional Chef Knife Set', brand: 'SharpEdge', price: 1285, description: 'High-carbon steel knife set with wooden block.', subcategory: 'Cutlery', image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop' },
    { name: 'Food Processor 2L', brand: 'ChopMaster', price: 3850, description: 'Multi-function food processor for chopping and mixing.', subcategory: 'Food Prep', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Commercial Blender 2L', brand: 'BlendMax', price: 4850, description: 'Heavy-duty blender for smoothies and sauces.', subcategory: 'Food Prep', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Deep Fryer 6L', brand: 'FryKing', price: 5850, description: 'Electric deep fryer with temperature control.', subcategory: 'Cooking Equipment', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Stainless Steel Mixing Bowls Set', brand: 'KitchenPro', price: 685, description: 'Set of 5 mixing bowls in different sizes.', subcategory: 'Preparation', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Commercial Rice Cooker 10L', brand: 'RiceMaster', price: 6850, description: 'Large capacity rice cooker for restaurants.', subcategory: 'Cooking Equipment', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Pizza Oven Thermometer', brand: 'HeatCheck', price: 485, description: 'High-temperature thermometer for pizza ovens.', subcategory: 'Measurement', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Food Storage Containers Set', brand: 'FreshKeep', price: 1285, description: 'Airtight containers for food storage and organization.', subcategory: 'Storage', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Commercial Coffee Machine', brand: 'BrewMaster', price: 28500, description: 'Espresso and cappuccino machine for cafes.', subcategory: 'Beverages', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
    { name: 'Kitchen Scale 10kg', brand: 'WeighRight', price: 985, description: 'Digital kitchen scale for accurate measurements.', subcategory: 'Measurement', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    { name: 'Disposable Paper Cups (Pack of 1000)', brand: 'EcoServe', price: 485, description: 'Biodegradable paper cups for takeaway drinks.', subcategory: 'Disposables', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop' }
  ],

  retail: [
    // General Merchandise
    { name: 'Smart LED TV 43 inch', brand: 'ViewMax', price: 28500, description: 'Full HD Smart LED TV with WiFi and multiple apps.', subcategory: 'Electronics', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop' },
    { name: 'Bluetooth Wireless Headphones', brand: 'SoundPro', price: 1850, description: 'Noise-canceling wireless headphones with 20hr battery.', subcategory: 'Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop' },
    { name: 'Cotton T-Shirt Pack of 5', brand: 'ComfortWear', price: 985, description: 'Premium cotton t-shirts in assorted colors.', subcategory: 'Clothing', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop' },
    { name: 'Running Shoes', brand: 'SportMax', price: 2850, description: 'Lightweight running shoes with air cushioning.', subcategory: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop' },
    { name: 'Travel Backpack 30L', brand: 'TravelPro', price: 1485, description: 'Durable travel backpack with multiple compartments.', subcategory: 'Bags', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop' },
    { name: 'Smartphone 128GB', brand: 'TechMax', price: 15850, description: '5G enabled smartphone with triple camera setup.', subcategory: 'Mobile', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop' },
    { name: 'Power Bank 10000mAh', brand: 'ChargePro', price: 985, description: 'Fast charging power bank with LED display.', subcategory: 'Accessories', image: 'https://images.unsplash.com/photo-1609592806318-46b970285b20?w=400&h=300&fit=crop' },
    { name: 'LED Desk Lamp', brand: 'LightMax', price: 685, description: 'Adjustable LED desk lamp with USB charging port.', subcategory: 'Lighting', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
    { name: 'Digital Wall Clock', brand: 'TimeKeeper', price: 485, description: 'Digital wall clock with temperature display.', subcategory: 'Home Decor', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&h=300&fit=crop' },
    { name: 'Fitness Tracker', brand: 'FitMax', price: 2485, description: 'Water-resistant fitness tracker with heart rate monitor.', subcategory: 'Wearables', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=300&fit=crop' },
    { name: 'Board Games Set', brand: 'FunTime', price: 785, description: 'Collection of classic board games for family fun.', subcategory: 'Games', image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop' },
    { name: 'Yoga Mat Premium', brand: 'FlexMax', price: 1285, description: 'Non-slip yoga mat with alignment guides.', subcategory: 'Fitness', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' }
  ],

  wholesale: [
    // Bulk Products
    { name: 'A4 Paper 500 Sheets (Pack of 10)', brand: 'PaperMax', price: 2850, description: 'High-quality A4 copier paper for office use.', subcategory: 'Stationery', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Ballpoint Pens (Pack of 100)', brand: 'WriteWell', price: 485, description: 'Smooth writing ballpoint pens in blue ink.', subcategory: 'Writing', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Staplers (Pack of 12)', brand: 'OfficeMax', price: 1485, description: 'Heavy-duty staplers for office documentation.', subcategory: 'Office Tools', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Cardboard Boxes (Pack of 50)', brand: 'PackMax', price: 1850, description: 'Corrugated cardboard boxes for shipping.', subcategory: 'Packaging', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Bubble Wrap Roll 100m', brand: 'ProtectMax', price: 985, description: 'Protective bubble wrap for fragile items.', subcategory: 'Packaging', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Duct Tape (Pack of 24)', brand: 'SealMax', price: 1285, description: 'Heavy-duty duct tape for repairs and sealing.', subcategory: 'Adhesives', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Safety Gloves (Pack of 50)', brand: 'WorkSafe', price: 1485, description: 'Cut-resistant safety gloves for industrial use.', subcategory: 'Safety', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Industrial Cleaning Kit', brand: 'CleanMax', price: 2850, description: 'Complete cleaning supplies for commercial spaces.', subcategory: 'Cleaning', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'File Folders (Pack of 100)', brand: 'OrganizeMax', price: 985, description: 'Manila file folders for document organization.', subcategory: 'Organization', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' },
    { name: 'Warehouse Labels (Pack of 1000)', brand: 'LabelMax', price: 785, description: 'Adhesive labels for inventory management.', subcategory: 'Labels', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop' }
  ]
};

const seedBusinessProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    logger.info('Existing products cleared');

    const allProducts = [];

    // Create products for each business type
    Object.entries(businessSpecificProducts).forEach(([businessType, productList]) => {
      productList.forEach((product, index) => {
        const basePrice = product.price;
        const discountPercentage = Math.floor(Math.random() * 15) + 5; // 5-20% discount
        const discountedPrice = Math.floor(basePrice * (1 - discountPercentage / 100));

        allProducts.push({
          name: product.name,
          description: product.description,
          category: getCategoryForBusinessType(businessType),
          subcategory: product.subcategory,
          brand: product.brand,
          sku: `${businessType.toUpperCase()}-${(index + 1).toString().padStart(3, '0')}`,
          price: {
            mrp: basePrice,
            discountedPrice: discountedPrice,
            currency: 'INR'
          },
          inventory: {
            stock: Math.floor(Math.random() * 200) + 50,
            reserved: Math.floor(Math.random() * 10),
            minStock: 10,
            maxStock: 500,
            unit: getUnitForProduct(product.name)
          },
          specifications: {
            weight: `${Math.floor(Math.random() * 10) + 1} kg`,
            dimensions: {
              length: Math.floor(Math.random() * 30) + 10,
              width: Math.floor(Math.random() * 30) + 10,
              height: Math.floor(Math.random() * 30) + 10
            },
            batchNumber: `BATCH${Math.floor(Math.random() * 10000)}`
          },
          images: [
            `https://picsum.photos/400/300?random=${businessType}${index + 1}`,
            `https://picsum.photos/400/300?random=${businessType}${index + 100}`
          ],
          tags: [businessType, product.subcategory.toLowerCase(), 'business', 'quality'],
          features: [`High quality ${product.subcategory}`, 'Business grade', 'Reliable supplier'],
          ratings: {
            average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5 to 5.0
            count: Math.floor(Math.random() * 150) + 25
          },
          analytics: {
            views: Math.floor(Math.random() * 1000) + 100,
            purchases: Math.floor(Math.random() * 50) + 5,
            trendingScore: Math.floor(Math.random() * 100)
          },
          supplier: {
            name: `${product.brand} Supplier`,
            contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            address: 'Business District, India'
          },
          isActive: true,
          isFeatured: Math.random() > 0.6, // 40% chance to be featured
          businessType: businessType // Add business type for easier filtering
        });
      });
    });

    // Add some general products that work for all business types
    const generalProducts = [
      { name: 'WiFi Router Dual Band', category: 'Electronics', brand: 'NetMax', price: 2850, description: 'High-speed dual-band WiFi router with 4 antennas.' },
      { name: 'Security Camera System', category: 'Electronics', brand: 'WatchMax', price: 8500, description: '4-camera security system with night vision.' },
      { name: 'POS Terminal', category: 'Electronics', brand: 'PayMax', price: 12850, description: 'All-in-one POS system for retail businesses.' },
      { name: 'Cash Register', category: 'Office Supplies', brand: 'CashMax', price: 5850, description: 'Electronic cash register with receipt printer.' },
      { name: 'Air Purifier', category: 'Electronics', brand: 'FreshAir', price: 4850, description: 'HEPA filter air purifier for clean indoor air.' }
    ];

    generalProducts.forEach((product, index) => {
      allProducts.push({
        ...product,
        subcategory: 'General',
        sku: `GEN-${(index + 1).toString().padStart(3, '0')}`,
        price: {
          mrp: product.price,
          discountedPrice: Math.floor(product.price * 0.9),
          currency: 'INR'
        },
        inventory: {
          stock: Math.floor(Math.random() * 100) + 30,
          reserved: 0,
          minStock: 5,
          maxStock: 200,
          unit: 'pieces'
        },
        specifications: {
          weight: '2-5 kg',
          dimensions: {
            length: 30,
            width: 25,
            height: 15
          }
        },
        images: [`https://picsum.photos/400/300?random=gen${index + 1}`],
        ratings: {
          average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
          count: Math.floor(Math.random() * 100) + 20
        },
        analytics: {
          views: Math.floor(Math.random() * 500) + 50,
          purchases: Math.floor(Math.random() * 25) + 5,
          trendingScore: Math.floor(Math.random() * 80) + 20
        },
        supplier: {
          name: `${product.brand} Store`,
          contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          address: 'Tech Park, India'
        },
        tags: ['general', 'business', 'popular'],
        features: ['Business grade', 'Warranty included', 'Fast delivery'],
        isActive: true,
        isFeatured: true
      });
    });

    const createdProducts = await Product.insertMany(allProducts);
    logger.info(`Created ${createdProducts.length} business-specific products`);

    return createdProducts;
  } catch (error) {
    logger.error('Error seeding business products:', error);
    throw error;
  }
};

function getCategoryForBusinessType(businessType) {
  const categoryMap = {
    pharmacy: 'Health',
    grocery: 'Groceries',
    restaurant: 'Kitchen',
    retail: 'Electronics',
    wholesale: 'Office Supplies'
  };
  return categoryMap[businessType] || 'General';
}

function getUnitForProduct(productName) {
  const name = productName.toLowerCase();
  if (name.includes('tablet') || name.includes('capsule') || name.includes('pack')) return 'pieces';
  if (name.includes('ml') || name.includes('liquid') || name.includes('syrup')) return 'ml';
  if (name.includes('kg') || name.includes('rice') || name.includes('flour') || name.includes('dal')) return 'kg';
  if (name.includes('liter') || name.includes('oil') || name.includes('milk')) return 'liter';
  if (name.includes('gram') || name.includes('powder') || name.includes('salt')) return 'gm';
  return 'pieces'; // default
}

module.exports = { seedBusinessProducts };