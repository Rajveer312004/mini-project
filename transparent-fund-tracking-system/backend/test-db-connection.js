const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set ✓' : 'NOT SET ✗');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env file!');
  console.log('\nPlease create backend/.env file with:');
  console.log('MONGO_URI=mongodb://localhost:27017/fundtracker');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // List collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('\nCollections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'No collections yet');
      }
      mongoose.connection.close();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check MONGO_URI in backend/.env file');
    console.log('3. For local MongoDB: mongodb://localhost:27017/fundtracker');
    console.log('4. For MongoDB Atlas: Use your Atlas connection string');
    process.exit(1);
  });

