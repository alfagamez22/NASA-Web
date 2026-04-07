const bcrypt = require("bcryptjs");
require("dotenv/config");

async function main() {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  const hash = await bcrypt.hash("harveybuan123", 12);
  
  const result = await pool.query(
    `INSERT INTO users (id, username, password_hash, display_name, role, created_at, updated_at)
     VALUES (gen_random_uuid()::text, 'superadmin', $1, 'Super Admin', 'super_admin', NOW(), NOW())
     ON CONFLICT (username) DO UPDATE SET password_hash = $1, role = 'super_admin', display_name = 'Super Admin', updated_at = NOW()
     RETURNING id`,
    [hash]
  );
  
  console.log("Super admin seeded:", result.rows[0].id);
  await pool.end();
}

main();
