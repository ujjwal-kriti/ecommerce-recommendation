require('dotenv').config();
const connectDB = require('../src/config/database');
const mongoose = require('mongoose');
const Order = require('../src/models/Order');

const run = async () => {
  try {
    await connectDB();

    const total = await Order.countDocuments();

    const now = new Date();
    const days = parseInt(process.argv[2], 10) || 30;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentCount = await Order.countDocuments({ createdAt: { $gte: since } });

    console.log(`Total orders in DB: ${total}`);
    console.log(`Orders in last ${days} days: ${recentCount}`);

    // Optionally output sample order ids
    const sample = await Order.find({ createdAt: { $gte: since } }).limit(5).select('_id createdAt totalAmount');
    console.log('Sample recent orders:', sample);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error counting orders:', err);
    process.exit(1);
  }
};

run();
