/**
 * Simple Admin Creation Script (Standalone)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    console.log('\n🔧 Creating Admin User...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    // Define schema directly (avoiding cache issues)
    const adminSchema = new mongoose.Schema({
      email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
      },
      password: { 
        type: String, 
        required: true, 
        minlength: 8 
      },
      name: { 
        type: String, 
        required: true 
      },
      role: { 
        type: String, 
        enum: ['admin', 'superadmin'], 
        default: 'superadmin' 
      },
      isActive: { 
        type: Boolean, 
        default: true 
      },
      loginAttempts: { 
        type: Number, 
        default: 0 
      },
      lastLogin: Date,
      lockUntil: Date,
      refreshToken: String
    }, { 
      timestamps: true 
    });

    // Hash password before saving
    adminSchema.pre('save', async function() {
      if (!this.isModified('password')) return;
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    });

    // Get or create model
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

    // Your admin details
    const adminData = {
      name: 'bhairava-jobs-admin',
      email: 'bhairava@gmail.com',
      password: 'bhairava-admin69',
      role: 'superadmin'
    };

    console.log('Creating admin with:');
    console.log(`Name: ${adminData.name}`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Role: ${adminData.role}\n`);

    // Check if exists
    const existing = await Admin.findOne({ email: adminData.email });
    if (existing) {
      console.log('⚠️  Admin already exists with this email!');
      console.log('Updating password instead...\n');
      
      existing.password = adminData.password;
      await existing.save();
      
      console.log('✅ Password updated successfully!\n');
    } else {
      // Create new admin
      const admin = await Admin.create(adminData);
      console.log('✅ Admin created successfully!\n');
      console.log('═══════════════════════════════════════════');
      console.log(`Name:  ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role:  ${admin.role}`);
      console.log(`ID:    ${admin._id}`);
      console.log('═══════════════════════════════════════════\n');
    }

    console.log('🔐 You can now login with:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}\n`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
