// server/scripts/createAdminUser.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MongoDB URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Admin user data
const adminUser = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isActive: true
};

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create new admin user
    const newAdmin = await User.create(adminUser);
    console.log('✅ Admin user created successfully:', newAdmin.username);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Disconnect from database
    mongoose.disconnect();
  }
};

// Run the function
createAdminUser();