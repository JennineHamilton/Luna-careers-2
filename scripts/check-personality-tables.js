/**
 * Check if personality tables exist in the database
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function checkTables() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check for personality tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'personality%'
      ORDER BY table_name;
    `);

    console.log('📊 Personality tables found:');
    if (result.rows.length === 0) {
      console.log('❌ No personality tables found!');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }

    // Check question count
    const questionCount = await client.query('SELECT COUNT(*) FROM personality_questions');
    console.log(`\n📝 Questions in database: ${questionCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();

