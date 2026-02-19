/**
 * Apply Cognitive Assessment migrations and seeds to Supabase database
 * Run with: node scripts/setup-cognitive-assessment.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const files = [
  { type: 'migration', file: '20260215_create_cognitive_assessment_tables.sql' },
  { type: 'seed', file: 'seed_cognitive_template.sql' },
  { type: 'seed', file: 'seed_cognitive_questions.sql' },
  { type: 'seed', file: 'seed_cognitive_norms.sql' }
];

async function setupCognitiveAssessment() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    for (const { type, file } of files) {
      const folder = type === 'migration' ? 'migrations' : 'seeds';
      const filePath = path.join(__dirname, '..', 'supabase', folder, file);

      console.log(`📄 Applying ${type}: ${file}`);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ Successfully applied: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error applying ${file}:`);
        console.error(error.message);
        console.error('\nFull error:', error);
        throw error; // Stop on first error
      }
    }

    console.log('🎉 Cognitive assessment system setup complete!\n');
    console.log('📋 Next steps:');
    console.log('1. Test taking the cognitive assessment');
    console.log('2. Verify results are calculated correctly');
    console.log('3. Check that percentiles are displayed');

  } catch (error) {
    console.error('❌ Setup process failed');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

setupCognitiveAssessment();

