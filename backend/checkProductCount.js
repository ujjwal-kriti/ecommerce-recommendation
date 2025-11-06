const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkProductCount() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/qwipo-recommendations');

    console.log('📊 Counting products...');
    const totalProducts = await Product.countDocuments();
    console.log(`Total products: ${totalProducts}`);

    const groceryProducts = await Product.countDocuments({ businessType: 'grocery' });
    console.log(`Grocery products: ${groceryProducts}`);

    const pharmacyProducts = await Product.countDocuments({ businessType: 'pharmacy' });
    console.log(`Pharmacy products: ${pharmacyProducts}`);

    console.log('\n📋 All product names:');
    const allProducts = await Product.find({}, 'name businessType').sort({ name: 1 });
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.businessType})`);
    });

    console.log('\n🔍 Pagination Test (limit: 4):');
    const page1 = await Product.find({}).limit(4).skip(0);
    console.log('Page 1:', page1.map(p => p.name));
    
    const page2 = await Product.find({}).limit(4).skip(4);
    console.log('Page 2:', page2.map(p => p.name));

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductCount();