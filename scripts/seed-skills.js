/**
 * Skills Seed Data Runner
 * Connects to Supabase and seeds the skills table
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function seedSkills() {
  const client = getDbClient();

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const seedFile = path.join(__dirname, '../supabase/seeds/skills_seed.sql');
    const sql = fs.readFileSync(seedFile, 'utf8');
    
    console.log('\nSeeding skills data...');
    await client.query(sql);
    
    // Get count of skills
    const result = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`\n✅ Skills seeded successfully! Total skills: ${result.rows[0].count}`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

seedSkills()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed');
    process.exit(1);
  });

