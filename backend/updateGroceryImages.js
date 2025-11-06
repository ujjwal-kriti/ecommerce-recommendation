const mongoose = require('mongoose');
const Product = require('./src/models/Product');

// New grocery product images - you can replace these URLs with your preferred images
const newGroceryImages = {
  
  "Premium Basmati Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
  "Almonds 500g": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8IFEmM-ULJmC9XuPg_YAk8p2ukOTkIVrMkw&s",
  "Basmati Rice 5kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
  "Brown Bread Loaf": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
  "Fresh Milk 1L": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop",
  "Amul Butter 100g": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop",
  "Maggi Noodles 70g": "https://www.shutterstock.com/image-photo/uttar-pradesh-india-november-12-260nw-2544477885.jpg",
  "Cadbury Dairy Milk 55g": "https://images.unsplash.com/photo-1575377427642-087cf684f29d?w=400&h=400&fit=crop",
  "Parle-G Biscuits 100g": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcQL-EkucigY9C1B26fgMJIVjueg9zUxpZ4A&s",

  "Tata Salt 1kg": "https://images.unsplash.com/photo-1594631661960-28ea2e4b8faa?w=400&h=400&fit=crop&crop=center", // Salt
  "Fortune Sunflower Oil 1L": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop&crop=center", // Cooking oil
  "Aashirvaad Atta 5kg": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&crop=center", // Wheat flour
  "MTR Ready Mix 200g": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop&crop=center", // Spice mix
  "Haldiram's Namkeen 200g": "https://images.unsplash.com/photo-1577003833619-76bbd40b6dbe?w=400&h=400&fit=crop&crop=center", // Indian snacks
  "Britannia Good Day 100g": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&crop=center", // Cookies
  "Real Fruit Juice 1L": "https://images.unsplash.com/photo-1584864592877-8cf1e4d2b7a2?w=400&h=400&fit=crop&crop=center", // Fruit juice
  
  // Add more products here:
  "Organic Whole Wheat Flour": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&crop=center", // Flour
  "Kurkure Masala Munch 90g": "https://images.unsplash.com/photo-1739065882919-03c8ae1a3da3?q=80&w=1415&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Snacks
  "Horlicks Health Drink 500g": "https://t4.ftcdn.net/jpg/06/07/03/13/240_F_607031303_LtLtuIsF7vQRGhfoesYg6bovIk7Pny0K.jpg", // Health drink
  "Tata Tea Premium 250g": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center", // Tea
  "Surf Excel Detergent 1kg": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop&crop=center", // Detergent
  "Lays Classic Salted 52g": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop&crop=center", // Chips
  "Colgate Toothpaste 100g": "https://m.media-amazon.com/images/I/61f+32QXZML._UF1000,1000_QL80_.jpg", // Toothpaste
};

async function updateGroceryImages() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/qwipo-recommendations');

    console.log('🛒 Finding grocery products...');
    const groceryProducts = await Product.find({ businessType: 'grocery' });
    console.log(`📦 Found ${groceryProducts.length} grocery products`);

    let updatedCount = 0;

    for (const product of groceryProducts) {
      const newImageUrl = newGroceryImages[product.name];
      
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

    console.log(`\n🎉 Successfully updated ${updatedCount} grocery product images!`);
    console.log('\n📝 To add custom images for specific products, edit the newGroceryImages object in this script');
    console.log('🔗 You can use any image URL (Unsplash, your own hosting, etc.)');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error updating images:', error.message);
  }
}

updateGroceryImages();