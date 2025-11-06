const mongoose = require('mongoose');
const Product = require('./src/models/Product');

// New pharmacy product images - add your preferred image URLs here
const newPharmacyImages = {
  // Current pharmacy products (exact names from database)
  "Paracetamol Tablets 500mg": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&crop=center", // Medicine tablets
  "Hand Sanitizer 100ml": "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=400&fit=crop&crop=center", // Sanitizer
  "Vitamin C Tablets": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=center", // Vitamins
  "Antiseptic Cream 50g": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop&crop=center", // First aid cream
  "Cough Syrup 100ml": "https://images.unsplash.com/photo-1571172440513-2e0a404bb77a?w=400&h=400&fit=crop&crop=center", // Cough syrup
  "Digital Thermometer": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop&crop=center", // Medical device
  "Bandage Roll 5m": "https://images.unsplash.com/photo-1603398938174-0c0b7ad97ce9?w=400&h=400&fit=crop&crop=center", // First aid
  "Blood Pressure Monitor": "https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=400&h=400&fit=crop&crop=center", // Medical device
  "Multivitamin Tablets": "https://images.unsplash.com/photo-1550572017-0b5b419a2ba5?w=400&h=400&fit=crop&crop=center", // Vitamins
  "Antacid Tablets": "https://images.unsplash.com/photo-1550572017-0b5b419a2ba5?w=400&h=400&fit=crop&crop=center", // Antacid medicine
  "Eye Drops 10ml": "https://images.unsplash.com/photo-1570736401998-8e8dab8b4f72?w=400&h=400&fit=crop&crop=center", // Eye drops
  "Pain Relief Gel 30g": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop&crop=center", // Pain relief gel
  "Glucose Meter Kit": "https://images.unsplash.com/photo-1559757264-4f8c33e8e9e3?w=400&h=400&fit=crop&crop=center", // Medical device
  "Surgical Face Masks": "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=400&fit=crop&crop=center", // Face masks
  "Cold & Flu Tablets": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&crop=center", // Medicine tablets
  "First Aid Kit": "https://images.unsplash.com/photo-1603398938095-9e2b4f1e37f3?w=400&h=400&fit=crop&crop=center", // First aid kit
  "Calcium Tablets": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=center", // Calcium supplements
  
  // Add more pharmacy products here:
  // "New Medicine Name": "https://your-image-url.com/medicine.jpg",
};

async function updatePharmacyImages() {
  try {
    console.log('💊 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/qwipo-recommendations');

    console.log('🏥 Finding pharmacy products...');
    const pharmacyProducts = await Product.find({ businessType: 'pharmacy' });
    console.log(`💉 Found ${pharmacyProducts.length} pharmacy products`);

    let updatedCount = 0;

    for (const product of pharmacyProducts) {
      const newImageUrl = newPharmacyImages[product.name];
      
      if (newImageUrl) {
        await Product.findByIdAndUpdate(product._id, {
          images: [newImageUrl]
        });
        console.log(`✅ Updated image for: ${product.name}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No new image found for: ${product.name} (keeping original)`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} pharmacy product images!`);
    console.log('\n📝 To add custom images for specific products, edit the newPharmacyImages object in this script');
    console.log('🔗 You can use any image URL (Unsplash, medical stock photos, etc.)');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error updating pharmacy images:', error.message);
  }
}

updatePharmacyImages();