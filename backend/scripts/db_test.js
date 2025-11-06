require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qwipo-recommendations';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const productCount = await Product.countDocuments();
    console.log('Product count:', productCount);

  const userCount = await User.countDocuments();
    console.log('User count:', userCount);

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error('DB test error:', err.message);
    process.exit(1);
  }
}

run();
