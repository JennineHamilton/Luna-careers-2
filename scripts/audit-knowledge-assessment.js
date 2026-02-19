/**
 * Audit Knowledge Assessment Database
 * Run with: node scripts/audit-knowledge-assessment.js
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';
const assessmentId = 'e7ac8d9b-3d31-4ca4-b40f-1fc510642168';

async function auditDatabase() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    // 1. Check the assessment data
    console.log('📊 ASSESSMENT DATA:');
    console.log('='.repeat(80));
    const assessmentResult = await client.query(
      'SELECT id, title, total_questions_in_pool, questions_per_attempt FROM knowledge_assessments WHERE id = $1',
      [assessmentId]
    );
    console.log(assessmentResult.rows[0]);
    console.log('');

    // 2. Check actual question count
    console.log('📝 ACTUAL QUESTION COUNT:');
    console.log('='.repeat(80));
    const questionCountResult = await client.query(
      'SELECT COUNT(*) as actual_count FROM knowledge_questions WHERE assessment_id = $1',
      [assessmentId]
    );
    console.log('Actual questions in database:', questionCountResult.rows[0].actual_count);
    console.log('');

    // 3. Check the constraint
    console.log('🔒 CHECK CONSTRAINT:');
    console.log('='.repeat(80));
    const constraintResult = await client.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'valid_questions_per_attempt'
    `);
    console.log(constraintResult.rows[0]);
    console.log('');

    // 4. Check the trigger function
    console.log('⚙️  TRIGGER FUNCTION:');
    console.log('='.repeat(80));
    const triggerResult = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'update_assessment_question_count'
    `);
    console.log(triggerResult.rows[0]?.prosrc || 'NOT FOUND');
    console.log('');

    // 5. Check all assessments with potential issues
    console.log('⚠️  ASSESSMENTS WITH CONSTRAINT VIOLATIONS:');
    console.log('='.repeat(80));
    const violationsResult = await client.query(`
      SELECT id, title, total_questions_in_pool, questions_per_attempt,
        CASE 
          WHEN total_questions_in_pool = 0 AND questions_per_attempt = 0 THEN 'OK'
          WHEN total_questions_in_pool > 0 AND questions_per_attempt > 0 AND questions_per_attempt <= total_questions_in_pool THEN 'OK'
          ELSE 'VIOLATION'
        END as status
      FROM knowledge_assessments
      WHERE NOT (
        questions_per_attempt >= 0 
        AND (
          (total_questions_in_pool = 0 AND questions_per_attempt = 0)
          OR (total_questions_in_pool > 0 AND questions_per_attempt > 0 AND questions_per_attempt <= total_questions_in_pool)
        )
      )
    `);
    if (violationsResult.rows.length === 0) {
      console.log('✅ No violations found');
    } else {
      console.log('❌ Found violations:');
      console.table(violationsResult.rows);
    }
    console.log('');

    // 6. Check RLS policies
    console.log('🔐 RLS POLICIES:');
    console.log('='.repeat(80));
    const policiesResult = await client.query(`
      SELECT tablename, policyname, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename IN ('knowledge_assessments', 'knowledge_questions', 'knowledge_question_options')
      ORDER BY tablename, policyname
    `);
    console.table(policiesResult.rows);

  } catch (error) {
    console.error('\n❌ Audit failed!', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

auditDatabase();

