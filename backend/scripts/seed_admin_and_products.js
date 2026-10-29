const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

const seed = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'password123';

    // Create or update admin user
    let admin = await User.findOne({ email: adminEmail.toLowerCase() }).exec();
    if (admin) {
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log(`Updated existing admin: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: 'Demo Admin',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        businessType: 'grocery',
        businessName: 'Demo Shop',
        phone: '9999999999',
        businessAddress: { street: 'Demo St', city: 'Demo City', state: 'Demo', zipCode: '000000' },
        role: 'admin',
        isActive: true
      });
      console.log(`Created demo admin: ${adminEmail}`);
    }

    // Sample products to seed
    const sampleProducts = [
      {
        name: 'Organic Almonds 500g',
        description: 'Premium organic almonds, rich in nutrients.',
        category: 'Nuts',
        brand: 'HealthyHarvest',
        sku: 'ALM-500-ORG',
        price: { mrp: 800, discountedPrice: 699 },
        inventory: { stock: 120, unit: 'g' },
        images: [],
        businessType: 'grocery'
      },
      {
        name: 'Horlicks Classic 500g',
        description: 'Nutritious malt drink for adults and kids.',
        category: 'Beverages',
        brand: 'Horlicks',
        sku: 'HRL-500',
        price: { mrp: 240, discountedPrice: 199 },
        inventory: { stock: 80, unit: 'g' },
        images: [],
        businessType: 'grocery'
      }
    ];

    for (const p of sampleProducts) {
      const exists = await Product.findOne({ sku: p.sku }).exec();
      if (exists) {
        console.log(`Product exists, skipping: ${p.sku}`);
      } else {
        await Product.create(p);
        console.log(`Inserted product: ${p.sku}`);
      }
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
