const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
require('dotenv').config();

// Sample demo users
const demoUsers = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@demo.com",
    phone: "9876543210",
    businessType: "grocery",
    businessName: "Kumar General Store",
    businessAddress: {
      street: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India"
    }
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@demo.com", 
    phone: "9876543211",
    businessType: "pharmacy",
    businessName: "Sharma Medical Store",
    businessAddress: {
      street: "456 Health Road",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India"
    }
  },
  {
    name: "Amit Patel",
    email: "amit.patel@demo.com",
    phone: "9876543212",
    businessType: "grocery",
    businessName: "Patel Mart",
    businessAddress: {
      street: "789 Commerce Lane",
      city: "Ahmedabad",
      state: "Gujarat",
      zipCode: "380001",
      country: "India"
    }
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@demo.com",
    phone: "9876543213",
    businessType: "pharmacy",
    businessName: "Reddy Pharmacy",
    businessAddress: {
      street: "321 Care Street",
      city: "Hyderabad",
      state: "Telangana",
      zipCode: "500001",
      country: "India"
    }
  }
];

// Function to generate random order patterns
function getRandomItems(products, maxItems = 5) {
  const shuffled = products.sort(() => 0.5 - Math.random());
  const numItems = Math.floor(Math.random() * maxItems) + 1;
  return shuffled.slice(0, numItems);
}

function getRandomQuantity(productName) {
  // Different quantity patterns for different products
  if (productName.includes('Noodles') || productName.includes('Biscuits')) {
    return Math.floor(Math.random() * 10) + 1; // 1-10
  } else if (productName.includes('Rice') || productName.includes('Flour')) {
    return Math.floor(Math.random() * 3) + 1; // 1-3
  } else if (productName.includes('Tablets') || productName.includes('Drops')) {
    return Math.floor(Math.random() * 2) + 1; // 1-2
  } else {
    return Math.floor(Math.random() * 5) + 1; // 1-5
  }
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

async function createDemoOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qwipo-recommendations');
    console.log('Connected to MongoDB');

    // Clear existing demo users and orders
    console.log('Clearing existing demo data...');
    await User.deleteMany({ email: { $regex: '@demo.com$' } });
    await Order.deleteMany({});
    console.log('Demo data cleared');

    // Create demo users
    console.log('Creating demo users...');
    const createdUsers = [];
    for (const userData of demoUsers) {
      const user = new User({
        ...userData,
        password: 'demo123', // Will be hashed by pre-save middleware
        isVerified: true
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    console.log(`Created ${createdUsers.length} demo users`);

    // Get all products
    const allProducts = await Product.find({ isActive: true });
    const groceryProducts = allProducts.filter(p => p.businessType === 'grocery');
    const pharmacyProducts = allProducts.filter(p => p.businessType === 'pharmacy');

    console.log(`Found ${groceryProducts.length} grocery products and ${pharmacyProducts.length} pharmacy products`);

    // Generate orders for each user
    const orders = [];
    const orderStatuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'pending'];
    const paymentMethods = ['upi', 'card', 'cod', 'netbanking'];
    const recommendationSources = ['organic', 'organic', 'recommendation', 'ai-assistant'];

    for (const user of createdUsers) {
      const userProducts = user.businessType === 'grocery' ? groceryProducts : pharmacyProducts;
      const numOrders = Math.floor(Math.random() * 8) + 3; // 3-10 orders per user

      for (let i = 0; i < numOrders; i++) {
        const orderItems = getRandomItems(userProducts, 4);
        const items = [];
        let subtotal = 0;

        // Create order items
        for (const product of orderItems) {
          const quantity = getRandomQuantity(product.name);
          const price = product.price.discountedPrice;
          const discount = (product.price.mrp - product.price.discountedPrice) * quantity;
          const total = price * quantity;

          items.push({
            productId: product._id,
            quantity,
            price,
            discount,
            total
          });

          subtotal += total;
        }

        // Calculate totals
        const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
        const tax = Math.round(subtotal * 0.18); // 18% GST
        const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
        const grandTotal = subtotal + tax + shipping;

        // Create order
        const order = new Order({
          userId: user._id,
          orderNumber: `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          items,
          totalAmount: {
            subtotal,
            discount: totalDiscount,
            tax,
            shipping,
            grandTotal
          },
          shippingAddress: {
            fullName: user.name,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.businessAddress?.street || "Demo Address",
            street: user.businessAddress?.street || "Demo Address", 
            city: user.businessAddress?.city || "Demo City",
            state: user.businessAddress?.state || "Demo State",
            pincode: user.businessAddress?.zipCode || "000000",
            zipCode: user.businessAddress?.zipCode || "000000",
            country: user.businessAddress?.country || "India"
          },
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          paymentStatus: Math.random() > 0.1 ? 'completed' : 'pending', // 90% completed
          orderStatus: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          recommendationSource: recommendationSources[Math.floor(Math.random() * recommendationSources.length)],
          createdAt: getRandomDate(60), // Orders from last 60 days
          updatedAt: getRandomDate(30)
        });

        orders.push(order);
      }
    }

    // Save all orders
    console.log('Creating demo orders...');
    const savedOrders = await Order.insertMany(orders);
    console.log(`Created ${savedOrders.length} demo orders`);

    // Display summary
    const ordersByUser = {};
    const ordersByBusinessType = {};
    const ordersByStatus = {};
    let totalRevenue = 0;

    for (const order of savedOrders) {
      const user = createdUsers.find(u => u._id.equals(order.userId));
      const userKey = `${user.name} (${user.businessType})`;
      
      ordersByUser[userKey] = (ordersByUser[userKey] || 0) + 1;
      ordersByBusinessType[user.businessType] = (ordersByBusinessType[user.businessType] || 0) + 1;
      ordersByStatus[order.orderStatus] = (ordersByStatus[order.orderStatus] || 0) + 1;
      totalRevenue += order.totalAmount.grandTotal;
    }

    console.log('\n📊 Demo Data Summary:');
    console.log('='.repeat(50));
    console.log(`👥 Total Users: ${createdUsers.length}`);
    console.log(`📦 Total Orders: ${savedOrders.length}`);
    console.log(`💰 Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
    
    console.log('\n📋 Orders by User:');
    Object.entries(ordersByUser).forEach(([user, count]) => {
      console.log(`  ${user}: ${count} orders`);
    });

    console.log('\n🏪 Orders by Business Type:');
    Object.entries(ordersByBusinessType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} orders`);
    });

    console.log('\n📊 Orders by Status:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} orders`);
    });

    console.log('\n✅ Demo data created successfully!');
    console.log('📈 Analytics and Business Insights should now show meaningful data');
    
    mongoose.disconnect();

  } catch (error) {
    console.error('Error creating demo data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createDemoOrders();