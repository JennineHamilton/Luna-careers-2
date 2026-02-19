/**
 * Check existing skills in database
 */

const { getDbClient } = require('./db-config');

async function checkSkills() {
  const client = getDbClient();

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all unique categories
    const result = await client.query('SELECT DISTINCT category FROM skills ORDER BY category');
    console.log('Existing skill categories:');
    result.rows.forEach(row => {
      console.log(`  - ${row.category}`);
    });

    // Get count
    const count = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`\nTotal skills: ${count.rows[0].count}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSkills();

