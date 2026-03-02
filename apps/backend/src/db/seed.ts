/**
 * Seed script — creates the default admin user.
 * Run: npm run seed
 */
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://starlight_admin:change_me_in_production@localhost:5432/starlight_inventory',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    // Get IT Department id
    const deptResult = await client.query(
      "SELECT id FROM departments WHERE name = 'IT Department' LIMIT 1"
    );
    const itDeptId = deptResult.rows[0]?.id;

    // Check if admin already exists
    const existing = await client.query(
      "SELECT id FROM users WHERE email = 'admin@starlight.com' LIMIT 1"
    );

    if (existing.rows.length > 0) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }

    const passwordHash = await bcrypt.hash('Admin@1234', 12);

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      ['IT Admin', 'admin@starlight.com', passwordHash, 'admin', itDeptId || null]
    );

    console.log('✓ Default admin created: admin@starlight.com / Admin@1234');
    console.log('  IMPORTANT: Change the password after first login!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
