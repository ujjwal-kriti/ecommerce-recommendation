const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function manualUpdateImage() {
  try {
    console.log('🔧 Manual Image Update Tool');
    console.log('================================');
    
    await mongoose.connect('mongodb://localhost:27017/qwipo-recommendations');

    // MANUAL UPDATE EXAMPLE:
    // Change "Almonds 500g" image to your custom URL
    const productName = "Almonds 500g"; // ← CHANGE THIS
    const newImageUrl = "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=400&fit=crop&crop=center"; // ← CHANGE THIS
    
    const result = await Product.findOneAndUpdate(
      { name: productName },
      { 
        $set: { 
          images: [
            newImageUrl,
            "https://via.placeholder.com/400x400/DEB887/8B4513?text=Fallback+Image"
          ] 
        }
      },
      { new: true }
    );

    if (result) {
      console.log(`✅ Updated ${productName} image to: ${newImageUrl}`);
    } else {
      console.log(`❌ Product "${productName}" not found`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// TO USE THIS SCRIPT:
// 1. Change productName and newImageUrl above
// 2. Run: node manualImageUpdate.js

console.log('📝 INSTRUCTIONS:');
console.log('1. Edit lines 12-13 in this file:');
console.log('   - productName: "Your Product Name"');
console.log('   - newImageUrl: "https://your-image-url.com/image.jpg"');
console.log('2. Run: node manualImageUpdate.js');
console.log('3. Refresh your frontend');

// Uncomment the line below to run the update:
manualUpdateImage();