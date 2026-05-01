/**
 * Script to create the first admin user
 * Run: npm run create-admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   Create First Admin User                     ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('❌ Error: MONGO_URI not found in .env file');
      process.exit(1);
    }

    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    // Check if any admin already exists
    const existingAdminCount = await Admin.countDocuments();
    if (existingAdminCount > 0) {
      console.log(`⚠️  Warning: ${existingAdminCount} admin(s) already exist in the database.`);
      const confirm = await question('Do you want to create another admin? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('❌ Admin creation cancelled');
        rl.close();
        process.exit(0);
      }
      console.log('');
    }

    // Get admin details
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 8 characters): ');
    const roleInput = await question('Enter role (admin/superadmin) [default: superadmin]: ');
    
    const role = roleInput.trim() === '' ? 'superadmin' : roleInput.toLowerCase();

    // Validate inputs
    if (!name || name.trim() === '') {
      console.error('❌ Error: Name is required');
      rl.close();
      process.exit(1);
    }

    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      console.error('❌ Error: Invalid email format');
      rl.close();
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters');
      rl.close();
      process.exit(1);
    }

    if (!['admin', 'superadmin'].includes(role)) {
      console.error('❌ Error: Role must be either "admin" or "superadmin"');
      rl.close();
      process.exit(1);
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.error('❌ Error: Admin with this email already exists');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Creating admin...');

    // Create admin
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role
    });

    console.log('\n✅ Admin created successfully!\n');
    console.log('═══════════════════════════════════════════════');
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.role}`);
    console.log(`ID:    ${admin._id}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('🔐 You can now login with these credentials\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    
    if (error.code === 11000) {
      console.error('This email is already registered');
    }
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }

    rl.close();
    process.exit(1);
  }
};

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n👋 Admin creation cancelled');
  rl.close();
  process.exit(0);
});

// Run the script
createAdmin();
