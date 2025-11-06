const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkDemoUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/qwipo-recommendations');
    
    const users = await User.find({}, 'email name businessType').limit(10);
    console.log('Available demo users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user.businessType}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDemoUsers();