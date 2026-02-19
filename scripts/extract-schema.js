/**
 * Extract database schema and save to schema-data.json
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function extractSchema() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📋 Found ${tablesResult.rows.length} tables`);

    // Get all columns
    const columnsResult = await client.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.udt_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `);

    console.log(`📊 Found ${columnsResult.rows.length} columns`);

    // Get all enums
    const enumsResult = await client.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    console.log(`🏷️  Found ${enumsResult.rows.length} enums`);

    // Get foreign key relationships
    const relationshipsResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    console.log(`🔗 Found ${relationshipsResult.rows.length} relationships`);

    // Get views
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`👁️  Found ${viewsResult.rows.length} views`);

    // Get functions
    const functionsResult = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname;
    `);

    console.log(`⚙️  Found ${functionsResult.rows.length} functions\n`);

    // Build schema data
    const schemaData = {
      tables: tablesResult.rows,
      columns: columnsResult.rows,
      enums: enumsResult.rows,
      relationships: relationshipsResult.rows,
      views: viewsResult.rows,
      functions: functionsResult.rows
    };

    // Save to file
    const outputPath = path.join(__dirname, '..', 'types', 'schema-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(schemaData, null, 2));

    console.log(`💾 Schema data saved to: ${outputPath}`);
    console.log('\n✅ Schema extraction complete!');
    console.log('\nNext step: Run node scripts/generate-typescript-types.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

extractSchema();

