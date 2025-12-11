// Load environment variables FIRST
require('dotenv').config();

const { sequelize } = require('../config/db');
const User = require('../model/user.model');
const PopularItem = require('../model/popularItem.model');

/**
 * Migration script to add admin features
 * Run this file to update your database with the new admin features
 */

async function runMigration() {
  try {
    console.log('Starting migration...');

    // Sync User model (will add is_admin column if it doesn't exist)
    await User.sync({ alter: true });
    console.log('✓ User model synced (is_admin field added)');

    // Create PopularItems table
    await PopularItem.sync({ force: false });
    console.log('✓ PopularItems table created');

    // Optionally, create a default admin user
    const createAdmin = process.argv.includes('--create-admin');

    if (createAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@livebaz.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
      const adminName = process.env.ADMIN_NAME || 'Admin';

      const existingAdmin = await User.findOne({ where: { Email: adminEmail } });

      if (!existingAdmin) {
        await User.create({
          Name: adminName,
          Email: adminEmail,
          Password: adminPassword,
          is_admin: true
        });
        console.log(`✓ Admin user created:`);
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
        console.log(`  IMPORTANT: Change this password immediately!`);
      } else {
        // Update existing user to be admin
        await existingAdmin.update({ is_admin: true });
        console.log(`✓ Updated existing user (${adminEmail}) to admin`);
      }
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your server');
    console.log('2. Visit http://localhost:5173/admin/login');
    console.log('3. Login with your admin credentials');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
